#!/usr/bin/env node
/**
 * Drift guard for the style desk.
 *
 * The desk (editor/style-desk.html) previews captions by PORTING the engine's
 * paint constants inline (so it stays a single self-contained file). That port
 * can silently rot when the engine changes. This asserts the desk's embedded
 * CAPTION_DEFAULTS and caption PRESETS still equal the engine's — run it in CI
 * or before shipping. It checks values, not key order.
 *
 *   node editor/check-fidelity.mjs      # exit 0 = in sync, 1 = drifted
 */
import { CAPTION_DEFAULTS, CAPTION_PRESETS } from "../src/caption.mjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "style-desk.html"), "utf8");

/** Pull a top-level `const NAME = { … };` object literal out of the desk source. */
function grab(name) {
  const m = html.match(new RegExp("const " + name + " = (\\{[\\s\\S]*?\\n\\});"));
  if (!m) throw new Error(`could not find ${name} in style-desk.html`);
  return new Function("return (" + m[1] + ")")();
}
const canon = (v) =>
  Array.isArray(v) ? v.map(canon)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])]))
  : v;
const eq = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));

const deskDefaults = grab("CAPTION_DEFAULTS");
const deskPresets = grab("PRESETS");
const problems = [];

for (const k of new Set([...Object.keys(CAPTION_DEFAULTS), ...Object.keys(deskDefaults)])) {
  if (!eq(CAPTION_DEFAULTS[k], deskDefaults[k]))
    problems.push(`CAPTION_DEFAULTS.${k}: engine=${JSON.stringify(CAPTION_DEFAULTS[k])} desk=${JSON.stringify(deskDefaults[k])}`);
}
for (const k of new Set([...Object.keys(CAPTION_PRESETS), ...Object.keys(deskPresets)])) {
  const engine = CAPTION_PRESETS[k] ? CAPTION_PRESETS[k].style : undefined;
  if (!eq(engine, deskPresets[k]))
    problems.push(`PRESETS.${k}: engine=${JSON.stringify(engine)} desk=${JSON.stringify(deskPresets[k])}`);
}

if (problems.length) {
  console.error("✗ style desk has drifted from the engine:\n  " + problems.join("\n  "));
  console.error('\nUpdate the "ported" constants in editor/style-desk.html to match src/caption.mjs.');
  process.exit(1);
}
console.log(`✓ style desk matches the engine — CAPTION_DEFAULTS + ${Object.keys(deskPresets).length} presets`);
