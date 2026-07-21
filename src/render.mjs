/**
 * The render pipeline: bring up the set, film the screenplay, encode the cut.
 *
 *   import { render } from "nolan";
 *   await render("demo.screenplay.json", { cut: "hero", out: "docs" });
 */
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { mkdirSync, rmSync, readdirSync, readFileSync, mkdtempSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { Director, bringUpSet } from "./director.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_STYLE = resolve(HERE, "../styles/default.json");

const readJson = (p) => JSON.parse(readFileSync(resolve(p), "utf8"));

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

  const tearDown = await bringUpSet(sp, baseDir);
  const problems = [];
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: st.encode.viewport });
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

/** Film a screenplay and encode every output the style declares. */
export async function render(screenplayPath, { cut, style, out, quiet } = {}) {
  const sp = readJson(screenplayPath);
  const baseDir = dirname(resolve(screenplayPath));
  const st = readJson(style ?? DEFAULT_STYLE);
  const outDir = resolve(out ?? join(baseDir, "out"));
  const cutName = cut ?? Object.keys(sp.cuts)[0];
  if (!sp.cuts?.[cutName]) throw new Error(`no such cut: ${cutName}`);

  const say = (...a) => !quiet && console.log(...a);
  const videoDir = mkdtempSync(join(tmpdir(), "nolan-"));
  const tearDown = await bringUpSet(sp, baseDir);
  let manifest = [];

  try {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: st.encode.viewport,
      recordVideo: { dir: videoDir, size: st.encode.viewport },
    });
    const page = await context.newPage();
    if (sp.set?.initScript) await page.addInitScript(sp.set.initScript);

    const d = new Director(page, sp, st, { name: cutName, ...sp.cuts[cutName] });
    say(`· filming "${sp.title}" — cut: ${cutName} (pace ${d.pace})`);
    await d.play();
    manifest = d.manifest;

    await context.close(); // flushes the video
    await browser.close();
  } finally {
    tearDown();
  }

  const webm = readdirSync(videoDir).find((f) => f.endsWith(".webm"));
  if (!webm) throw new Error("no video was recorded");
  mkdirSync(outDir, { recursive: true });

  const written = [];
  for (const o of st.encode.outputs) {
    const target = join(outDir, `${sp.slug}-${cutName}.${o.ext}`);
    say(`· encoding ${o.name} → ${target}`);
    execSync(`ffmpeg -y -loglevel error -i "${resolve(videoDir, webm)}" ${o.args} "${target}"`, {
      stdio: "inherit",
    });
    written.push(target);
  }
  rmSync(videoDir, { recursive: true, force: true });

  const seconds = (manifest.at(-1)?.at ?? 0) / 1000;
  say(`✓ ${manifest.length} beats · ${seconds.toFixed(1)}s`);
  return { outputs: written, manifest, seconds };
}
