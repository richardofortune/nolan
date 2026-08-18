/**
 * The word-highlight schedule is the one piece of caption timing that is pure,
 * and it had no tests. These pin the two things a settle must not break: the
 * sweep keeps the pace it would have had without one, and the states still tile
 * the segment exactly, so the compositor never leaves a gap or overruns.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { wordSchedule } from "../src/composite.mjs";
import { normalizeCaption, paintPalette } from "../src/caption.mjs";
import { rigScript } from "../src/director.mjs";

// rigScript reads a few blocks off the style; give it the shape it expects.
const BASE_STYLE = {
  cursor: { show: false },
  presenter: { show: false },
  encode: { viewport: { width: 1000, height: 700 } },
  timing: { readingSpeed: 30 },
};

const TEXT = "one two three";

test("with no delay the sweep starts immediately", () => {
  const s = wordSchedule(TEXT, 30, 10, 14);
  assert.equal(s[0].active, 0);
  assert.equal(s[0].start, 10);
});

test("a delay adds a settle frame with nothing lit", () => {
  const s = wordSchedule(TEXT, 30, 10, 14, 0.5);
  assert.equal(s[0].active, -1);
  assert.equal(s[0].start, 10);
  assert.ok(Math.abs(s[0].end - 10.5) < 1e-9);
  assert.equal(s[1].active, 0, "the sweep follows the settle");
});

test("the settle delays the sweep without compressing it", () => {
  const plain = wordSchedule(TEXT, 30, 10, 20);
  const delayed = wordSchedule(TEXT, 30, 10, 20, 0.5);
  const span = (states) => {
    const words = states.filter((s) => s.active >= 0 && s.active < 3);
    return words[words.length - 1].end - words[0].start;
  };
  assert.ok(Math.abs(span(plain) - span(delayed)) < 1e-9,
    "words must go by at the same speed either way");
});

test("states tile the segment with no gaps or overruns", () => {
  for (const delay of [0, 0.4, 99]) {
    const s = wordSchedule(TEXT, 30, 5, 9, delay);
    assert.equal(s[0].start, 5);
    assert.equal(s[s.length - 1].end, 9);
    for (let i = 1; i < s.length; i++) assert.equal(s[i].start, s[i - 1].end);
    for (const st of s) assert.ok(st.end >= st.start, "no negative window");
  }
});

test("an absurd delay is clamped into the segment rather than running past it", () => {
  const s = wordSchedule(TEXT, 30, 5, 9, 99);
  for (const st of s) {
    assert.ok(st.start >= 5 && st.start <= 9);
    assert.ok(st.end >= 5 && st.end <= 9);
  }
});

test("empty text still yields one state", () => {
  const s = wordSchedule("   ", 30, 1, 2, 0.5);
  assert.equal(s.length, 1);
});

test("dimOpacity and sweepDelay are clamped, not trusted", () => {
  assert.equal(normalizeCaption({ dimOpacity: 400 }).caption.dimOpacity, 100);
  assert.equal(normalizeCaption({ dimOpacity: -20 }).caption.dimOpacity, 0);
  assert.equal(normalizeCaption({ sweepDelay: -3 }).caption.sweepDelay, 0);
});

test("a non-numeric value falls back to the default and says so", () => {
  const { caption, warnings } = normalizeCaption({ sweepDelay: "soon" });
  assert.equal(caption.sweepDelay, 0);
  assert.ok(warnings.some((w) => w.includes("sweepDelay")));
});

test("the painter receives dimOpacity as a CSS fraction", () => {
  const { paints } = paintPalette({ caption: { preset: "karaoke", dimOpacity: 55 } });
  assert.equal(paints[""].dimOpacity, 0.55);
});

test("a variant can set its own settle", () => {
  const { paints } = paintPalette({
    caption: { preset: "karaoke", variants: { slow: { sweepDelay: 1.2 } } },
  });
  assert.equal(paints[""].sweepDelay, 0);
  assert.equal(paints.slow.sweepDelay, 1.2);
});

test("the default is off, so existing films are unchanged", () => {
  const { paints } = paintPalette({ caption: { preset: "karaoke" } });
  assert.equal(paints[""].sweepDelay, 0);
  assert.equal(paints[""].dimOpacity, 0.28);
  assert.deepEqual(wordSchedule(TEXT, 30, 0, 5), wordSchedule(TEXT, 30, 0, 5, 0));
});

/**
 * The rig runs in the browser, so it lives inside a template literal and Node
 * never parses it. A stray backtick in there is a syntax error nothing else
 * catches: the unit tests import composite.mjs and caption.mjs, and the failure
 * only shows up when a real film starts. Parsing it here closes that gap.
 */
test("the rig script is valid JavaScript", () => {
  const src = rigScript({ ...BASE_STYLE, caption: { preset: "karaoke", sweepDelay: 0.5 } });
  assert.doesNotThrow(() => new Function(src), "rigScript must parse");
});

test("the rig script carries the settle and the dim through to the browser", () => {
  const src = rigScript({ ...BASE_STYLE, caption: { preset: "karaoke", sweepDelay: 0.5, dimOpacity: 55 } });
  assert.match(src, /"sweepDelay":0\.5/);
  assert.match(src, /"dimOpacity":0\.55/);
});
