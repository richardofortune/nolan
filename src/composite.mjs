/**
 * Post-compositing — draw captions ON TOP of a finished recording.
 *
 * The expensive part of a demo is driving the real app through every
 * interaction. The captions are the part you restyle. So `post` mode records
 * the app CLEAN (cursor and clicks burned in, no caption bar) plus a segment
 * manifest, and this module paints the captions back on afterwards with ffmpeg.
 *
 * The payoff is the README's biggest-remaining-win: restyling captions — new
 * colours, a different preset, a variant tweak — becomes a re-encode (seconds)
 * instead of a re-film (minutes), because the clean master and the segments are
 * kept and only this pass re-runs.
 *
 * The rasteriser reuses the SAME browser that films, so composited captions are
 * pixel-identical in look to the burned-in ones — but painting N captions on a
 * blank page has no app and no interactions, so it is the fast pass.
 *
 * Trade-off, stated plainly: a composited caption is drawn in its resting,
 * fully-revealed state. The typewriter and the karaoke word-highlight are
 * animations, and preserving them in post would mean a frame sequence per
 * caption; they remain a `burn`-mode feature.
 */
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { paintPalette } from "./caption.mjs";

/* ----------------------------- the filtergraph ---------------------------- */

/**
 * Build the ffmpeg `-filter_complex` that lays each caption PNG over the base
 * video for its own [start, end] window. Pure — no I/O — so the timing logic is
 * unit-testable without a browser or ffmpeg.
 *
 * Inputs are assumed to be [0]=base video, [1..N]=the caption PNGs in segment
 * order. Returns null when there is nothing to draw.
 *
 * @param {{start:number,end:number}[]} segments
 * @param {{y:number}[]} imgMeta   per-segment overlay geometry, same order
 */
export function overlayFilterComplex(segments, imgMeta) {
  if (!segments.length) return null;
  const chains = [];
  let prev = "[0:v]";
  segments.forEach((seg, i) => {
    const out = i === segments.length - 1 ? "[capd]" : `[v${i}]`;
    const s = seg.start.toFixed(3);
    const e = seg.end.toFixed(3);
    // enable='between(t,s,e)' shows the overlay only for the caption's window.
    chains.push(`${prev}[${i + 1}:v]overlay=x=0:y=${imgMeta[i].y}:enable='between(t,${s},${e})'${out}`);
    prev = out;
  });
  return { filter: chains.join(";"), out: "[capd]" };
}

/* ------------------------------ rasterising ------------------------------- */

/** DOM identical to the burned-in rig, so composited captions match pixel-for-pixel. */
const PAINTER_INIT = `(() => {
  if (document.getElementById('film-cap')) return;
  document.documentElement.style.background = 'transparent';
  document.body.style.background = 'transparent';
  const bar = document.createElement('div');
  bar.id = 'film-cap';
  bar.innerHTML =
    '<span id="film-chip" style="display:none;align-items:center;gap:8px;flex:none">' +
    '<span id="film-av" style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;font:600 12px ui-monospace,Menlo,monospace"></span>' +
    '<span id="film-name" style="font-size:14px;color:#c9cdd4;white-space:nowrap"></span>' +
    '<span style="color:#3a3e46">|</span></span><span id="film-text"></span>';
  document.body.appendChild(bar);
})()`;

/**
 * Paint each caption to a transparent PNG and report where it sits.
 *
 * @returns {{file:string,y:number,height:number}[]} same order as `segments`
 */
export async function renderCaptionImages(page, style, segments, dir) {
  const { paints } = paintPalette(style);
  const { height: vh } = style.encode.viewport;
  await page.evaluate(PAINTER_INIT);

  const meta = [];
  for (const [i, seg] of segments.entries()) {
    const P = paints[seg.as || ""] || paints[""];
    await page.evaluate(
      ([paint, text, actor]) => {
        const bar = document.getElementById("film-cap");
        bar.style.cssText = paint.bar;
        const el = document.getElementById("film-text");
        el.style.cssText = paint.text;
        el.textContent = text; // resting state: full text, no caret
        const chip = document.getElementById("film-chip");
        if (paint.showChip && actor) {
          chip.style.display = "flex";
          const av = document.getElementById("film-av");
          av.style.background = actor.bg;
          av.style.color = actor.ink;
          av.style.borderRadius = actor.kind === "agent" ? "5px" : "50%";
          av.textContent = actor.kind === "agent" ? "▸" : actor.name[0];
          document.getElementById("film-name").textContent = actor.name;
        } else {
          chip.style.display = "none";
        }
      },
      [P, seg.text, seg.actor],
    );
    const el = await page.$("#film-cap");
    const box = await el.boundingBox();
    const file = join(dir, `${seg.id}.png`);
    await el.screenshot({ path: file, omitBackground: true });
    const y = P.position === "top-center" ? 0 : Math.round(vh - box.height);
    meta.push({ file, y, height: Math.round(box.height) });
  }
  return meta;
}

/* ------------------------------ orchestration ----------------------------- */

const q = (s) => `"${s}"`;

/**
 * Draw `segments` onto `master` using `style`, returning the path to a captioned
 * video the encode step can read. With no segments the master is returned
 * untouched — nothing to composite.
 *
 * The intermediate is lossless (ffv1) so the per-output encodes (gif palette,
 * h264) start from a clean frame, exactly as they did from the raw recording.
 */
export async function paintCaptionsOnto(master, segments, style, { say = () => {} } = {}) {
  if (!segments.length) return { path: master, cleanup: () => {} };

  const work = mkdtempSync(join(tmpdir(), "nolan-cap-"));
  const cleanup = () => rmSync(work, { recursive: true, force: true });
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: style.encode.viewport });
    const imgMeta = await renderCaptionImages(page, style, segments, work);
    await browser.close();

    const graph = overlayFilterComplex(segments, imgMeta);
    const captioned = join(work, "captioned.mkv");
    const inputs = imgMeta.map((m) => `-i ${q(m.file)}`).join(" ");
    say(`· compositing ${segments.length} caption(s)`);
    execSync(
      `ffmpeg -y -loglevel error -i ${q(master)} ${inputs} ` +
        `-filter_complex ${q(graph.filter)} -map ${q(graph.out)} -c:v ffv1 ${q(captioned)}`,
      { stdio: "inherit" },
    );
    return { path: captioned, cleanup };
  } catch (err) {
    cleanup();
    throw err;
  }
}
