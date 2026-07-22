/**
 * The render pipeline: bring up the set, film the screenplay, encode the cut.
 *
 *   import { render } from "nolan";
 *   await render("demo.screenplay.json", { cut: "hero", out: "docs" });
 */
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { mkdirSync, rmSync, readdirSync, readFileSync, writeFileSync, copyFileSync, mkdtempSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { Director, bringUpSet, resolveCam } from "./director.mjs";
import { resolveCaptionStyle } from "./caption.mjs";
import { paintCaptionsOnto } from "./composite.mjs";
import { SUBTITLE_FORMATS } from "./subtitles.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_STYLE = resolve(HERE, "../styles/default.json");

const readJson = (p) => JSON.parse(readFileSync(resolve(p), "utf8"));

/**
 * Browser context options from the screenplay's `set`. A real `userAgent` and
 * `locale` are what let nolan film sites that turn the default headless browser
 * away (Airbnb and friends) — declare them in `set` and every page inherits them.
 */
const contextOpts = (sp, st) => ({
  viewport: st.encode.viewport,
  ...(sp.set?.userAgent ? { userAgent: sp.set.userAgent } : {}),
  ...(sp.set?.locale ? { locale: sp.set.locale } : {}),
});

/**
 * Resolve every target in a screenplay WITHOUT filming or encoding.
 *
 * This is what CI wants: it answers "does this walkthrough still describe the
 * app?" in a few seconds. A demo that silently films the wrong thing is worse
 * than no demo, and screenshots in docs rot invisibly — this makes the rot a
 * build failure.
 */
export async function verify(screenplayPath, { cut, style } = {}) {
  const sp = readJson(screenplayPath);
  const baseDir = dirname(resolve(screenplayPath));
  const st = readJson(style ?? DEFAULT_STYLE);
  const cutName = cut ?? Object.keys(sp.cuts)[0];
  if (!sp.cuts?.[cutName]) throw new Error(`no such cut: ${cutName}`);

  // A caption variant named by a beat but absent from the style is the same
  // class of rot as a missing target: the demo won't say what it was written to
  // say. Catch it before we bother launching a browser.
  const { variants, warnings } = resolveCaptionStyle(st);
  const problems = warnings.map((w) => ({ scene: "style", beat: "caption", error: w }));
  for (const scene of sp.scenes) {
    for (const beat of scene.beats) {
      if (beat.do === "say" && beat.as && !variants[beat.as]) {
        problems.push({
          scene: scene.id, beat: "say",
          error: `no caption variant "${beat.as}" (style defines: ${Object.keys(variants).join(", ") || "none"})`,
        });
      }
    }
  }

  const tearDown = await bringUpSet(sp, baseDir);
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext(contextOpts(sp, st));
    const page = await context.newPage();
    if (sp.set?.initScript) await page.addInitScript(sp.set.initScript);
    const d = new Director(page, sp, st, { name: cutName, ...sp.cuts[cutName] });
    d.targetTimeout = 2500; // CI wants a fast, complete answer — not one slow failure

    for (const scene of sp.scenes) {
      if (!d.wanted(scene)) continue;
      for (const beat of scene.beats) {
        if (!d.wanted(beat)) continue;
        // Navigation and page-state beats must actually run, or later targets
        // are resolved against the wrong page.
        if (["goto", "cut", "call", "js", "http", "set", "scrollTo", "type"].includes(beat.do)) {
          await d.run({ ...beat, ms: 0, hold: 0, settle: 0 }).catch((e) =>
            problems.push({ scene: scene.id, beat: beat.do, error: e.message }));
          continue;
        }
        if (beat.to) {
          try {
            await d.point(beat.to);
          } catch (e) {
            problems.push({ scene: scene.id, beat: beat.do, error: e.message });
          }
        }
      }
    }
    await browser.close();
  } finally {
    tearDown();
  }
  return problems;
}

/** Run every encode the style declares against one source video. */
function encodeOutputs(source, st, outDir, slug, cutName, say) {
  const written = [];
  for (const o of st.encode.outputs) {
    const target = join(outDir, `${slug}-${cutName}.${o.ext}`);
    say(`· encoding ${o.name} → ${target}`);
    execSync(`ffmpeg -y -loglevel error -i "${source}" ${o.args} "${target}"`, { stdio: "inherit" });
    written.push(target);
  }
  return written;
}

/**
 * Write subtitle sidecars from the segments. The style declares which formats
 * (`encode.subtitles`); it defaults to both, since the whole point is a demo
 * that's searchable and screen-readable for free. `[]` opts out.
 */
function writeSubtitles(segments, st, outDir, slug, cutName, say) {
  const formats = st.encode.subtitles ?? ["srt", "vtt"];
  if (!segments.length || !formats.length) return [];
  const written = [];
  for (const name of formats) {
    const fmt = SUBTITLE_FORMATS[name];
    if (!fmt) { say(`· skipping unknown subtitle format "${name}"`); continue; }
    const target = join(outDir, `${slug}-${cutName}.${fmt.ext}`);
    say(`· subtitles → ${target}`);
    writeFileSync(target, fmt.render(segments));
    written.push(target);
  }
  return written;
}

/**
 * Film a screenplay and encode every output the style declares.
 *
 * `overlay` decides where the captions live:
 *   'burn' (default) — typed into the page and recorded, as before.
 *   'post'           — the app is filmed clean; captions are composited on
 *                      afterwards, and the clean master + segments are saved so
 *                      a restyle later is a re-encode, not a re-film.
 */
export async function render(screenplayPath, { cut, style, out, quiet, overlay = "burn" } = {}) {
  const sp = readJson(screenplayPath);
  const baseDir = dirname(resolve(screenplayPath));
  const st = readJson(style ?? DEFAULT_STYLE);
  const outDir = resolve(out ?? join(baseDir, "out"));
  const cutName = cut ?? Object.keys(sp.cuts)[0];
  if (!sp.cuts?.[cutName]) throw new Error(`no such cut: ${cutName}`);

  // Fold any presenter `cam` images into data URIs (paths are relative to the
  // screenplay), so the bubble renders on any filmed origin.
  resolveCam(sp.cast, baseDir);

  const say = (...a) => !quiet && console.log(...a);
  const videoDir = mkdtempSync(join(tmpdir(), "nolan-"));
  const tearDown = await bringUpSet(sp, baseDir);
  let manifest = [];
  let segments = [];

  try {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      ...contextOpts(sp, st),
      recordVideo: { dir: videoDir, size: st.encode.viewport },
    });
    const page = await context.newPage();
    if (sp.set?.initScript) await page.addInitScript(sp.set.initScript);

    const d = new Director(page, sp, st, { name: cutName, ...sp.cuts[cutName] });
    d.overlay = overlay;
    say(`· filming "${sp.title}" — cut: ${cutName} (pace ${d.pace}${overlay === "post" ? ", captions in post" : ""})`);
    await d.play();
    manifest = d.manifest;
    segments = d.segments;

    await context.close(); // flushes the video
    await browser.close();
  } finally {
    tearDown();
  }

  const webm = readdirSync(videoDir).find((f) => f.endsWith(".webm"));
  if (!webm) throw new Error("no video was recorded");
  mkdirSync(outDir, { recursive: true });
  const rawMaster = resolve(videoDir, webm);

  let written;
  let master;
  let segmentsPath;
  if (overlay === "post") {
    // Keep the clean master and the segments next to the outputs — these two
    // files are everything `restyle` needs to re-caption without the app.
    master = join(outDir, `${sp.slug}-${cutName}.master.webm`);
    copyFileSync(rawMaster, master);
    segmentsPath = join(outDir, `${sp.slug}-${cutName}.segments.json`);
    writeFileSync(segmentsPath, JSON.stringify(segments, null, 2));

    const { path: captioned, cleanup } = await paintCaptionsOnto(rawMaster, segments, st, { say });
    try {
      written = encodeOutputs(captioned, st, outDir, sp.slug, cutName, say);
    } finally {
      cleanup();
    }
  } else {
    written = encodeOutputs(rawMaster, st, outDir, sp.slug, cutName, say);
  }
  rmSync(videoDir, { recursive: true, force: true });

  const subtitles = writeSubtitles(segments, st, outDir, sp.slug, cutName, say);

  const seconds = (manifest.at(-1)?.at ?? 0) / 1000;
  say(`✓ ${manifest.length} beats · ${seconds.toFixed(1)}s`);
  if (master) say(`· master kept → ${master} (restyle with: nolan restyle ${segmentsPath})`);
  return { outputs: written, subtitles, manifest, segments, seconds, master, segmentsPath };
}

/**
 * Re-caption a clean master with a (possibly different) style — no app, no
 * browser-driving, just paint + encode. This is the phase-2 payoff: changing
 * the caption look of an existing demo in seconds.
 *
 * Point it at the `*.segments.json` a `post`-mode render left behind; the master
 * webm is found alongside it unless `master` overrides.
 */
export async function restyle(segmentsPath, { style, out, quiet, master, slug, cut } = {}) {
  const segments = readJson(segmentsPath);
  const st = readJson(style ?? DEFAULT_STYLE);
  const dir = dirname(resolve(segmentsPath));
  const say = (...a) => !quiet && console.log(...a);

  // `<slug>-<cut>.segments.json` → sibling `<slug>-<cut>.master.webm`.
  const base = /^(.*)\.segments\.json$/.exec(resolve(segmentsPath).split("/").pop() ?? "");
  const stem = base?.[1] ?? "restyled";
  const masterPath = master ?? join(dir, `${stem}.master.webm`);
  // "splitter-hero" → ["splitter","hero"]; a stem with no cut keeps a sane name.
  const [slugPart, cutPart = "restyled"] = stem.includes("-") ? stem.split(/-(?=[^-]*$)/) : [stem];
  const outDir = resolve(out ?? dir);
  mkdirSync(outDir, { recursive: true });

  say(`· restyling ${segments.length} caption(s) from ${masterPath}`);
  const { path: captioned, cleanup } = await paintCaptionsOnto(masterPath, segments, st, { say });
  try {
    const written = encodeOutputs(captioned, st, outDir, slug ?? slugPart, cut ?? cutPart, say);
    const subtitles = writeSubtitles(segments, st, outDir, slug ?? slugPart, cut ?? cutPart, say);
    say(`✓ restyled · ${written.length} output(s)`);
    return { outputs: written, subtitles };
  } finally {
    cleanup();
  }
}
