/**
 * A flash is a picture that shows and snaps back. The detector has to catch
 * that shape and leave real scene changes alone, or it either misses the bare
 * page between two curtains or cries wolf at every cut.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { findFlashes, frameDiff } from "../src/flash.mjs";

const N = 64;
const solid = (v) => new Uint8Array(N).fill(v);
const A = solid(116); // the purple curtain, near enough
const B = solid(255); // a bare white tab
const fps = 10;

test("frameDiff is the mean absolute pixel difference", () => {
  assert.equal(frameDiff(A, A), 0);
  assert.equal(frameDiff(A, B), 255 - 116);
});

test("a picture that shows and snaps back is a flash", () => {
  const frames = [A, A, A, B, B, A, A, A];
  assert.deepEqual(findFlashes(frames, { fps }), [{ frame: 3, run: 2 }]);
});

test("a scene change is not a flash", () => {
  const frames = [A, A, A, B, B, B, B, B, B, B];
  assert.deepEqual(findFlashes(frames, { fps }), []);
});

test("a run longer than maxRun is a scene, not a flash", () => {
  // 8 frames at 10fps is 0.8s, past the 0.6s default
  const frames = [A, A, B, B, B, B, B, B, B, B, A, A];
  assert.deepEqual(findFlashes(frames, { fps }), []);
  assert.deepEqual(findFlashes(frames, { fps, maxRun: 1 }), [{ frame: 2, run: 8 }]);
});

test("small drift between frames is not a change", () => {
  const frames = [A, solid(118), solid(117), A, A];
  assert.deepEqual(findFlashes(frames, { fps }), []);
});

test("two flashes are reported separately", () => {
  const frames = [A, A, B, A, A, A, B, B, A, A];
  assert.deepEqual(findFlashes(frames, { fps }), [
    { frame: 2, run: 1 },
    { frame: 6, run: 2 },
  ]);
});
