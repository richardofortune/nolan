/**
 * flashcheck — finds A → B → A flashes in a finished film.
 *
 * `lint` reads the writing and `verify` reads the targets; neither reads the
 * pixels. A flash is a short run of frames that differs from the frame before
 * it while the frame after the run matches that earlier frame: the film
 * showed something, then snapped back. Every one we've met was a background
 * state leaking between two overlays — a bare page between two curtains, the
 * app between two cards. A real scene change never comes back, so it doesn't
 * trip this.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

export const FLASH_DEFAULTS = {
  fps: 25,
  width: 160,
  height: 100,
  /** mean pixel difference (0–255) that counts as the picture changing */
  change: 6,
  /** mean pixel difference under which two frames are "the same picture" */
  same: 1.5,
  /** longest run, in seconds, still called a flash rather than a scene */
  maxRun: 0.6,
};

/** Mean absolute pixel difference between two greyscale frames, 0–255. */
export function frameDiff(a, b) {
  let s = 0;
  for (let k = 0; k < a.length; k++) s += Math.abs(a[k] - b[k]);
  return s / a.length;
}

/**
 * Pure detector over an array of greyscale frames (Uint8Array, all the same
 * length). Returns [{ frame, run }]: the index where the flash starts and how
 * many frames it lasts before the picture returns.
 */
export function findFlashes(frames, opts = {}) {
  const o = { ...FLASH_DEFAULTS, ...opts };
  const maxRun = Math.max(1, Math.round(o.fps * o.maxRun));
  const out = [];
  let i = 1;
  while (i < frames.length - 1) {
    if (frameDiff(frames[i - 1], frames[i]) < o.change) {
      i++;
      continue;
    }
    let run = 0;
    for (let w = 1; w <= maxRun && i + w < frames.length; w++) {
      if (frameDiff(frames[i - 1], frames[i + w]) < o.same) {
        run = w;
        break;
      }
    }
    if (run) {
      out.push({ frame: i, run });
      i += run + 1;
    } else {
      i++;
    }
  }
  return out;
}

/** Decode a film into small greyscale frames with ffmpeg. */
export function decodeFrames(file, opts = {}) {
  const o = { ...FLASH_DEFAULTS, ...opts };
  const res = spawnSync(
    "ffmpeg",
    ["-loglevel", "error", "-i", file, "-vf", `fps=${o.fps},scale=${o.width}:${o.height}`, "-f", "rawvideo", "-pix_fmt", "gray", "-"],
    { maxBuffer: 1 << 30 },
  );
  if (res.status !== 0) throw new Error(`ffmpeg could not decode ${file}: ${res.stderr?.toString().trim()}`);
  const size = o.width * o.height;
  const n = Math.floor(res.stdout.length / size);
  return Array.from({ length: n }, (_, i) => res.stdout.subarray(i * size, (i + 1) * size));
}

/**
 * Check one film. Returns [{ at, ms, frame, run }] in seconds/milliseconds.
 * With `framesDir`, writes before/flash/after stills for each hit so a person
 * can see what leaked.
 */
export function flashcheck(file, opts = {}) {
  const o = { ...FLASH_DEFAULTS, ...opts };
  const frames = decodeFrames(file, o);
  const hits = findFlashes(frames, o).map((h) => ({
    ...h,
    at: h.frame / o.fps,
    ms: Math.round((h.run / o.fps) * 1000),
  }));
  if (o.framesDir && hits.length) {
    mkdirSync(o.framesDir, { recursive: true });
    for (const h of hits) {
      const stamp = h.at.toFixed(2) + "s";
      for (const [tag, idx] of [["before", h.frame - 1], ["flash", h.frame], ["after", h.frame + h.run]]) {
        execFileSync("ffmpeg", [
          "-loglevel", "error", "-y", "-ss", String(idx / o.fps), "-i", file,
          "-frames:v", "1", "-vf", "scale=600:-1", join(o.framesDir, `${stamp}-${tag}.png`),
        ]);
      }
    }
  }
  return hits;
}
