/**
 * The caption bar is a full-width strip pinned to an edge at the very top of
 * the z-stack. Nothing in it is interactive, so it must not take clicks — and
 * for a long time it did, silently eating every click a screenplay aimed at the
 * bottom strip of the viewport. That is exactly where apps park the controls a
 * walkthrough wants to press, so the failure looked like a missing element
 * rather than a blocked click.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { paintCaption, paintPalette, normalizeCaption } from "../src/caption.mjs";
import { rigScript } from "../src/director.mjs";

const BASE_STYLE = {
  cursor: { show: false },
  presenter: { show: false },
  encode: { viewport: { width: 1000, height: 700 } },
  timing: { readingSpeed: 30 },
};

test("the painted bar refuses clicks", () => {
  const { bar } = paintCaption(normalizeCaption({}));
  assert.match(bar, /(^|;)pointer-events:none(;|$)/);
});

test("every variant refuses them too, not just the base", () => {
  const { paints } = paintPalette({
    caption: { preset: "docs", variants: { warn: { backgroundColor: "#3A2A0B" } } },
  });
  for (const [name, p] of Object.entries(paints)) {
    assert.match(p.bar, /(^|;)pointer-events:none(;|$)/, `variant "${name || "base"}"`);
  }
});

test("a top-anchored bar refuses them as well", () => {
  const { bar } = paintCaption(normalizeCaption({ position: "top-center" }));
  assert.match(bar, /(^|;)pointer-events:none(;|$)/);
});

// The cursor and the ripple carry their own pointer-events:none, so a bare
// search of the rig source proves nothing. Match the serialised bar paint.
test("the rig carries it through to the browser", () => {
  const src = rigScript({ ...BASE_STYLE, caption: { preset: "docs" } });
  assert.match(src, /"bar":"[^"]*pointer-events:none/);
});
