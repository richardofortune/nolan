# Style desk — roadmap

Where the local editor (`editor/style-desk.html`) is headed. The desk today tunes
**caption**, **cursor / click-pulse**, **presenter (with cast faces)**, and the
**steps tracker**, previewing them faithfully. This plans the rest.

## Principles (don't break these)

1. **One self-contained file, local-first.** No build, no server, no deps. Inline
   CSS/JS and inline assets as `data:` URIs. `npm run desk` or open the file.
2. **Fidelity over lookalike.** The preview's paint logic is *ported from the
   engine* (`src/caption.mjs`, the rig in `src/director.mjs`). Every new surface
   ports the real logic and marks it, so what you see is what nolan renders.
3. **Mirror the style file.** Desk sections map 1:1 to style blocks, so the JSON
   the desk emits is exactly a nolan style.
4. **Guard against drift.** As ports grow, add a check that the desk's embedded
   defaults still equal the engine's (see Cross-cutting).

## Effort key

`S` ≈ an hour · `M` ≈ a few hours · `L` ≈ a day+. Risk noted where real.

---

## Phase 1 — Open a film, tune it, save it back

Turn the desk from a knob-toy into an authoring loop. Highest daily value; the
real-copy preview it unlocks improves every other feature.

- **1a · Load a screenplay** ✅ done — "Open film…" parses a `*.screenplay.json`
  and the preview uses its real captions, step labels, cast, and starting URL
  (FSA `showOpenFilePicker` with an `<input type=file>` fallback).
- **1c · Per-caption cycling** ✅ done (landed with 1a) — the transport's ◄ ►
  line control walks every `say` line in context, applying each line's variant.
- **1b · Save back to the file** ✅ done — **Open style…** opens a style file
  (capturing its handle), **Save** (⌘/Ctrl-S) writes changes back in place via
  `showSaveFilePicker` / `createWritable`, re-using the handle so later saves
  don't re-prompt; Download / Copy / upload are the fallbacks where FSA is absent.

**Exit reached:** open a style, retune against a loaded film, Save, re-film — no
hand-editing JSON. **Phase 1 complete.**

Follow-up surfaced by 1a: a **loaded film's cast** shows initials because its
`cam` is an asset path the desk can't read. Resolving those (a directory pick, or
Phase 3 upload) would show real faces for loaded films too.

## Phase 2 — Cover the whole style file

- **2a · Caption variants editor** ✅ done — a "Caption variants" section: pick a
  variant (previews live), add/remove individual overrides, add or delete
  variants. Kept partial-by-construction, matching the merge chain.
- **2b · Transitions section + cut preview** ✅ done — `curtain` colour, `fadeMs`,
  title ink, and a **▶ Play the cut** button that runs the curtain wipe over the
  monitor.
- **2c · Timing / tempo section** ✅ done — `readingSpeed`, `minCaption`,
  `typeDelay`, `glideDefault`, with a live "this line holds ~X.Xs" readout that
  mirrors `captionMs()`.
- **Drift guard** ✅ done — `npm run desk:check` (`editor/check-fidelity.mjs`)
  asserts the desk's ported `CAPTION_DEFAULTS` + presets equal the engine's;
  proven to fail on a deliberate mismatch.
- **2d · Encode section** — *deferred, low priority.* Viewport / ffmpeg outputs /
  subtitles are rarely hand-tuned and the `outputs` array is awkward in a form;
  edit in the style file for now.

**Exit reached (bar 2d):** the desk emits and edits every *commonly tuned* field
a nolan style holds — caption + variants, cursor/click, presenter, steps, timing,
transitions. **Phase 2 essentially complete.**

## Phase 3 — Cast management

- **3a · Edit cast** `S` — name, avatar bg/ink per member.
- **3b · Add a face** `M` — upload an image, downscale on a `<canvas>`, embed as a
  `data:` URI (same shape as `resolveCam`). Bundled AI faces stay as defaults.

**Exit:** build a real film's cast in the desk, export cast entries for the
screenplay.

## Phase 4 — Template library (the product half)

The sellable idea: refined starting points per context.

- **4a · Ship context presets** `M` — one-click starting styles: **docs**,
  **support how-to**, **explain-to-nan**, **feature tour**. Stored as versioned
  files in `styles/templates/`, listed in the desk.
- **4b · "New from template"** `S` — start a fresh style from a preset, then tune.

**Exit:** a non-expert picks a context and gets a good-looking film immediately;
the library is the thing worth charging for.

## Phase 5 — Frame scrubbing (optional, later)

- **5 · Timeline over `segments.json` + `master.webm`** `L`, heavier — scrub the
  *actual filmed frames* and retime beats. Needs the video pipeline, unlike the
  live-preview desk. Park unless a real need appears.

---

## Cross-cutting

- **Drift guard** `S` — a small check (run in the existing lint/verify spirit)
  that asserts the desk's embedded `CAPTION_DEFAULTS` / preset values equal the
  engine's, so ports can't silently rot. Do this alongside Phase 2, when the
  ported surface roughly doubles.
- **Shared paint logic (stretch)** `L` — longer term, extract the pure paint
  functions so engine and desk consume one source instead of a port. Conflicts
  with "one self-contained file" unless there's an inlining step; revisit only if
  drift becomes painful.

## Suggested order

**1 → 2 → 3 → 4**, with the drift guard folded into Phase 2 and Phase 5 parked.
Rationale: Phase 1 makes it usable on real films (and everything downstream
previews better with real copy); Phase 2 makes it *complete*; Phase 3 supports
real casts; Phase 4 is the product payoff and wants a solid desk under it.

## Open decisions

- **Load/save mechanism** (Phase 1) — File System Access API + fallback, vs a tiny
  optional local server. Leaning FSA to preserve zero-dep.
- **How much of Phase 1 first** — 1a (load) alone is a satisfying increment; 1b
  (save) can follow once load feels right.
