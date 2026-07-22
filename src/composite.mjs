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
 * pixel-identical in look to the burned-in ones — but painting captions on a
 * blank page has no app and no interactions, so it is the fast pass.
 *
 * Word-level animation (karaoke / the pill highlight) survives compositing: a
 * highlighted caption is rendered as a SEQUENCE of stills — one per word-state
 * plus a resting frame — each overlaid on its own sub-window. Word timing is
 * derived from length, mirroring the burn-mode reveal. (Per-character typewriter
 * is not sequenced in post; a plain caption composites as a single resting still.)
 */
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { paintPalette } from "./caption.mjs";

/* ------------------------------ word timing ------------------------------- */

/**
 * The sequence of highlight states for one word-animated caption, tiling
 * [segStart, segEnd]. Each state names the active word index; the final state
 * (active === wordCount) is the resting frame with every word lit. Pure — the
 * timing is unit-testable without a browser. Mirrors the burn-mode reveal: total
 * sweep = text.length * readingSpeed, split across words by their length.
 */
export function wordSchedule(text, readingSpeed, segStart, segEnd) {
  const words = text.split(/\s+/).filter(Boolean);
  const n = words.length;
  if (!n) return [{ active: 0, start: segStart, end: segEnd }];
  const totalWordChars = words.reduce((a, w) => a + w.length, 0) || 1;
  const totalMs = text.length * readingSpeed;
  const states = [];
  let cum = 0;
  for (let i = 0; i < n; i++) {
    const start = segStart + cum / 1000;
    cum += Math.max(90, (words[i].length / totalWordChars) * totalMs);
    states.push({ active: i, start, end: segStart + cum / 1000 });
  }
  states.push({ active: n, start: segStart + cum / 1000, end: segEnd }); // resting
  // Clamp into [segStart, segEnd] and keep each window non-negative.
  for (const s of states) {
    s.start = Math.max(segStart, Math.min(s.start, segEnd));
    s.end = Math.max(s.start, Math.min(s.end, segEnd));
  }
  return states;
}

/* ----------------------------- the filtergraph ---------------------------- */

/**
 * Build the ffmpeg `-filter_complex` that lays each caption clip over the base
 * video for its own [start, end] window. Pure — no I/O. Inputs are [0]=base
 * video, [1..N]=the clip PNGs in order. Returns null when there's nothing to draw.
 *
 * @param {{y:number,start:number,end:number}[]} clips
 */
export function overlayFilterComplex(clips) {
  if (!clips.length) return null;
  const chains = [];
  let prev = "[0:v]";
  clips.forEach((c, i) => {
    const out = i === clips.length - 1 ? "[capd]" : `[v${i}]`;
    chains.push(
      `${prev}[${i + 1}:v]overlay=x=0:y=${c.y}:enable='between(t,${c.start.toFixed(3)},${c.end.toFixed(3)})'${out}`,
    );
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

/** Paint one caption state into the bar and screenshot it. `active` null → plain text. */
async function shoot(page, paint, text, actor, active, vh, file) {
  await page.evaluate(
    ([paint, text, actor, active]) => {
      const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
      const bar = document.getElementById("film-cap");
      bar.style.cssText = paint.bar;
      bar.style.transition = "none"; // a screenshot is a still — never catch a mid-transition frame
      const el = document.getElementById("film-text");
      el.style.cssText = paint.text;
      el.style.transition = "none";
      if (active === null) {
        el.textContent = text; // resting: full text, no caret
      } else {
        const pill = paint.highlightStyle === "pill";
        let wi = -1;
        el.innerHTML = text.split(/(\s+)/).map((w) => {
          if (/^\s+$/.test(w) || !w) return esc(w);
          wi++;
          const on = wi === active, past = wi < active;
          let s = "border-radius:.32em;padding:0 .16em;margin:0 -.16em;opacity:" + (past || on ? 1 : 0.28) + ";";
          if (on) s += pill ? "background:" + paint.highlightColor + ";color:" + paint.color + ";" : "color:" + paint.highlightColor + ";";
          else if (past) s += "color:" + paint.color + ";";
          return '<span style="' + s + '">' + esc(w) + "</span>";
        }).join("");
      }
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
    [paint, text, actor, active],
  );
  const el = await page.$("#film-cap");
  const box = await el.boundingBox();
  await el.screenshot({ path: file, omitBackground: true });
  return paint.position === "top-center" ? 0 : Math.round(vh - box.height);
}

/**
 * Render every caption to timed clips. A plain caption → one resting clip; a
 * word-highlighted caption → one clip per word-state plus a resting clip, each
 * with its own sub-window.
 *
 * @returns {{file:string,y:number,start:number,end:number}[]}
 */
export async function renderCaptionClips(page, style, segments, dir) {
  const { paints } = paintPalette(style);
  const { height: vh } = style.encode.viewport;
  const readingSpeed = style.timing?.readingSpeed ?? 22;
  await page.evaluate(PAINTER_INIT);

  const clips = [];
  let idx = 0;
  for (const seg of segments) {
    const P = paints[seg.as || ""] || paints[""];
    if (P.activeWordHighlight) {
      const states = wordSchedule(seg.text, readingSpeed, seg.start, seg.end);
      const wordCount = states.length - 1;
      for (const st of states) {
        const file = join(dir, `${seg.id}-${idx}.png`);
        // active === wordCount is the resting frame (every word lit)
        const y = await shoot(page, P, seg.text, seg.actor, st.active, vh, file);
        clips.push({ file, y, start: st.start, end: st.end });
        idx++;
      }
    } else {
      const file = join(dir, `${seg.id}.png`);
      const y = await shoot(page, P, seg.text, seg.actor, null, vh, file);
      clips.push({ file, y, start: seg.start, end: seg.end });
    }
  }
  return clips;
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
    const clips = await renderCaptionClips(page, style, segments, work);
    await browser.close();

    const graph = overlayFilterComplex(clips);
    const captioned = join(work, "captioned.mkv");
    const inputs = clips.map((c) => `-i ${q(c.file)}`).join(" ");
    say(`· compositing ${segments.length} caption(s)${clips.length > segments.length ? ` (${clips.length} frames)` : ""}`);
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
