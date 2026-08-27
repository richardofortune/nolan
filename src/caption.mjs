/**
 * Caption presentation — the style side.
 *
 * Captions resolve through a merge chain, borrowed from Cap's editor store:
 *
 *   CAPTION_DEFAULTS  ←  preset  ←  the style file's own caption fields  ←  variant
 *
 * A PRESET is a complete look ("docs", "karaoke"), named in the style file and
 * applying to every caption in the film. A VARIANT is a small semantic override
 * a single beat can ask for by name (`{ "do": "say", "as": "warn" }`) — the
 * screenplay says *this line is a warning*, the style file says what a warning
 * looks like. The screenplay never carries colours.
 *
 * Fields are flat scalars, not CSS shorthand, so one axis can be changed without
 * re-parsing a font string — and so a future picker (or an agent) can tweak them
 * safely. Legacy shorthand in older style files is migrated, not rejected.
 *
 * Nothing here throws. An unknown enum falls back to the default and returns a
 * warning; malformed style shouldn't stop a film mid-beat.
 */

/* ------------------------------ the schema -------------------------------- */

export const CAPTION_DEFAULTS = {
  // placement
  position: "bottom-center",
  height: 54,
  padding: "12px 22px",
  // type
  font: "-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
  fontWeight: 500,
  size: 18,
  lineHeight: 1.35,
  uppercase: false,
  italic: false,
  // paint
  color: "#F2F3F5",
  backgroundColor: "#16181D",
  backgroundOpacity: 100,
  outline: false,
  outlineColor: "#000000",
  fadeDuration: 0.2,
  // nolan-specific furniture
  caret: "▍",
  showChip: true,
  // word-level reveal
  activeWordHighlight: false,
  highlightColor: "#FFD400",
  highlightStyle: "color",
  wordTransitionDuration: 0.25,
  // How visible a word is before the highlight reaches it, 0-100. The whole
  // line is on screen from the first frame either way; this decides whether a
  // viewer can read ahead of the sweep or only sense the shape of the sentence.
  dimOpacity: 28,
  // Seconds the finished line rests, unlit, before the highlight starts moving.
  // Gives the eye time to take in the scene and the sentence before being led
  // through it. Additive: it lengthens the caption rather than compressing the
  // sweep, so reading time stays derived from the text.
  sweepDelay: 0,
};

export const POSITIONS = ["bottom-center", "top-center"];
export const HIGHLIGHT_STYLES = ["color", "pill"];

/**
 * Built-in presets. A style file can name one (`caption.preset`) and override
 * any field alongside it, or define its own under `caption.presets`.
 */
export const CAPTION_PRESETS = {
  docs: {
    label: "Docs",
    description: "A solid bar under the app. Reads as documentation.",
    style: {},
  },
  karaoke: {
    label: "Karaoke",
    description: "Words light up one at a time over a translucent bar.",
    style: {
      backgroundOpacity: 45,
      activeWordHighlight: true,
      highlightColor: "#FFD400",
      highlightStyle: "color",
      fadeDuration: 0.12,
    },
  },
  highlight: {
    label: "Highlight",
    description: "Bold caps with a pill behind the active word.",
    style: {
      fontWeight: 700,
      size: 20,
      uppercase: true,
      backgroundOpacity: 0,
      outline: true,
      activeWordHighlight: true,
      highlightColor: "#7C3AED",
      highlightStyle: "pill",
      fadeDuration: 0.12,
    },
  },
  minimal: {
    label: "Minimal",
    description: "Outlined text, no bar, nothing between you and the app.",
    style: {
      fontWeight: 600,
      size: 17,
      backgroundOpacity: 0,
      outline: true,
      showChip: false,
      fadeDuration: 0.25,
    },
  },
};

/* ------------------------------- migration -------------------------------- */

/** `"500 18px/1.35 -apple-system,sans-serif"` → the flat fields it stood for. */
function splitFontShorthand(shorthand) {
  const m = /^\s*(?:(italic)\s+)?(?:([1-9]00|normal|bold)\s+)?(\d+(?:\.\d+)?)px(?:\s*\/\s*(\d+(?:\.\d+)?))?\s+(.+)$/i
    .exec(shorthand);
  if (!m) return { font: shorthand };
  const [, italic, weight, size, lineHeight, family] = m;
  return {
    ...(italic ? { italic: true } : {}),
    ...(weight ? { fontWeight: weight === "bold" ? 700 : weight === "normal" ? 400 : +weight } : {}),
    size: +size,
    ...(lineHeight ? { lineHeight: +lineHeight } : {}),
    font: family.trim(),
  };
}

/**
 * Accept the pre-flat-fields style vocabulary. Restyling every demo you own from
 * one file only holds if old files keep working, so this converts rather than
 * complains.
 */
export function migrateLegacy(raw = {}) {
  // `$comment` and friends are documentation, not style — drop them so they
  // never end up merged into a caption object.
  const out = Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith("$")));
  if (out.bg != null && out.backgroundColor == null) out.backgroundColor = out.bg;
  if (out.ink != null && out.color == null) out.color = out.ink;
  delete out.bg;
  delete out.ink;
  if (out.position === "bottom" || out.position === "top") out.position = `${out.position}-center`;
  // A font shorthand only migrates the axes it actually specifies; anything
  // stated explicitly alongside it wins.
  if (typeof out.font === "string" && /\d+px/.test(out.font)) {
    const parts = splitFontShorthand(out.font);
    for (const [k, v] of Object.entries(parts)) if (raw[k] == null || k === "font") out[k] = v;
  }
  return out;
}

/* ------------------------------ normalising ------------------------------- */

const isNum = (v) => typeof v === "number" && Number.isFinite(v);

/** Coerce to the schema, collecting complaints instead of throwing. */
export function normalizeCaption(input = {}, where = "caption") {
  const warnings = [];
  const c = { ...CAPTION_DEFAULTS, ...input };

  const oneOf = (key, allowed) => {
    if (!allowed.includes(c[key])) {
      warnings.push(`${where}.${key}: "${c[key]}" is not one of ${allowed.join(" | ")} — using "${CAPTION_DEFAULTS[key]}"`);
      c[key] = CAPTION_DEFAULTS[key];
    }
  };
  oneOf("position", POSITIONS);
  oneOf("highlightStyle", HIGHLIGHT_STYLES);

  for (const key of ["height", "size", "lineHeight", "fontWeight", "fadeDuration", "wordTransitionDuration", "backgroundOpacity", "dimOpacity", "sweepDelay"]) {
    if (!isNum(c[key])) {
      warnings.push(`${where}.${key}: expected a number, got ${JSON.stringify(c[key])} — using ${CAPTION_DEFAULTS[key]}`);
      c[key] = CAPTION_DEFAULTS[key];
    }
  }
  c.backgroundOpacity = Math.min(100, Math.max(0, c.backgroundOpacity));
  c.dimOpacity = Math.min(100, Math.max(0, c.dimOpacity));
  c.sweepDelay = Math.max(0, c.sweepDelay);

  for (const key of ["uppercase", "italic", "outline", "showChip", "activeWordHighlight"]) {
    c[key] = Boolean(c[key]);
  }
  return { caption: c, warnings };
}

/**
 * Resolve a whole style document's caption block into the base look plus every
 * named variant, each fully merged and normalised.
 *
 * @returns {{ base: object, variants: Record<string, object>, warnings: string[] }}
 */
export function resolveCaptionStyle(style = {}) {
  const raw = migrateLegacy(style.caption ?? {});
  const { preset: presetName, presets: own = {}, variants: rawVariants = {}, ...inline } = raw;

  const warnings = [];
  let presetStyle = {};
  if (presetName != null) {
    const found = own[presetName] ?? CAPTION_PRESETS[presetName]?.style;
    if (found) presetStyle = migrateLegacy(found.style ?? found);
    else warnings.push(
      `caption.preset: no preset named "${presetName}" — known: ${
        [...new Set([...Object.keys(CAPTION_PRESETS), ...Object.keys(own)])].join(", ")}`);
  }

  const merged = normalizeCaption({ ...presetStyle, ...inline }, "caption");
  warnings.push(...merged.warnings);

  const variants = {};
  for (const [name, patch] of Object.entries(rawVariants)) {
    // Variants are PARTIAL — layered over the resolved base, never a whole look.
    const v = normalizeCaption({ ...merged.caption, ...migrateLegacy(patch) }, `caption.variants.${name}`);
    warnings.push(...v.warnings);
    variants[name] = v.caption;
  }
  return { base: merged.caption, variants, warnings };
}

/** Every name a `say` beat may legally use in `as`. */
export function variantNames(style) {
  return Object.keys(resolveCaptionStyle(style).variants);
}

/* --------------------------------- paint ---------------------------------- */

/** `#16181D` + 45 → `rgba(22,24,29,0.45)`. Non-hex colours pass through at 100%. */
export function withAlpha(colour, opacityPct) {
  const pct = Math.min(100, Math.max(0, opacityPct ?? 100));
  if (pct >= 100) return colour;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(colour).trim());
  if (!hex) return pct === 0 ? "transparent" : colour;
  let h = hex[1];
  if (h.length === 3) h = h.split("").map((ch) => ch + ch).join("");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${(pct / 100).toFixed(3)})`;
}

const outlineShadow = (colour) =>
  [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1.2], [0, 1.2], [-1.2, 0], [1.2, 0]]
    .map(([x, y]) => `${x}px ${y}px 0 ${colour}`).join(",");

/**
 * Turn resolved fields into the CSS the rig applies. Computed here in Node so
 * the injected script stays a dumb painter — no style logic in the page.
 */
export function paintCaption(c) {
  const bg = withAlpha(c.backgroundColor, c.backgroundOpacity);
  const bare = c.backgroundOpacity === 0;
  return {
    bar: [
      "position:fixed",
      c.position === "top-center" ? "top:0" : "bottom:0",
      "left:0", "right:0",
      "z-index:2147483646",
      // The bar is a full-width strip at the very top of the stack, and nothing
      // in it is interactive — so it must never take a click. Without this it
      // swallows every click landing in its strip, which is where apps put the
      // controls a walkthrough most wants to press: chat launchers, cookie
      // banners, floating action buttons.
      "pointer-events:none",
      `background:${bg}`,
      `color:${c.color}`,
      `font:${c.italic ? "italic " : ""}${c.fontWeight} ${c.size}px/${c.lineHeight} ${c.font}`,
      `padding:${c.padding}`,
      `min-height:${Math.max(0, c.height - 24)}px`,
      "display:flex", "align-items:center", "gap:13px",
      bare ? "box-shadow:none" : "box-shadow:0 -1px 8px rgba(0,0,0,.3)",
      `transition:background-color ${c.fadeDuration}s,color ${c.fadeDuration}s`,
    ].join(";"),
    text: [
      "flex:1",
      c.uppercase ? "text-transform:uppercase" : "text-transform:none",
      c.outline ? `text-shadow:${outlineShadow(c.outlineColor)}` : "text-shadow:none",
      bare ? "text-align:center" : "text-align:left",
    ].join(";"),
    // behaviour the painter needs at reveal time
    position: c.position,
    color: c.color,
    caret: c.caret,
    showChip: c.showChip,
    activeWordHighlight: c.activeWordHighlight,
    highlightColor: c.highlightColor,
    highlightStyle: c.highlightStyle,
    wordTransition: c.wordTransitionDuration,
    // 0-100 in the style file, a CSS fraction by the time a painter sees it
    dimOpacity: c.dimOpacity / 100,
    sweepDelay: c.sweepDelay,
  };
}

/** `{ "": <base paint>, warn: <variant paint>, ... }` — the rig's whole palette. */
export function paintPalette(style) {
  const { base, variants, warnings } = resolveCaptionStyle(style);
  const paints = { "": paintCaption(base) };
  for (const [name, v] of Object.entries(variants)) paints[name] = paintCaption(v);
  return { paints, warnings };
}
