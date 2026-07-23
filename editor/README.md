# nolan · style desk

A single-file visual editor for a nolan **style** — captions, cursor, click
pulse, presenter bubble, and the how-to step tracker — with a live preview and
an exportable `style.json`. No build, no server, no dependencies.

```bash
npm run desk          # opens editor/style-desk.html in your browser
# or just open the file directly:
open editor/style-desk.html
# prefer localhost? any static server works, no deps:
python3 -m http.server -d editor 8080   # then visit http://localhost:8080/style-desk.html
```

Edit the file, refresh the browser — that's the whole loop. Everything is inline
(CSS, JS, and the cast face images as `data:` URIs), so there is nothing to build
and no server required.

## What it does

- **Live monitor** — a 10:7 frame (nolan's viewport aspect) showing the caption
  bar, presenter, step rail, cursor, and click pulse react as you tune them.
- **Instrument rail** — grouped like the style file: Caption (with a **variants**
  editor — tune warn / aside / code or add your own, one override at a time),
  Cursor & click press, Presenter bubble, Steps tracker, **Timing & tempo** (with
  a live "this line holds ~X.Xs" readout), and **Transitions** (with a "play the
  cut" preview).
- **Transport** — switch caption variants (base / warn / aside / code), scrub the
  step position, and **Test press** to fire the click pulse (or click the frame).
- **`style.json`, live** — the JSON drawer mirrors your edits, so it drops
  straight into a render:

  ```bash
  nolan demo.screenplay.json --style=my-style.json
  ```

- **Open film…** loads a real `*.screenplay.json` — the preview switches to its
  actual captions (cycle them with the ◄ ► line control), step labels, cast, and
  starting URL. **sample** returns to the built-in demo.
- **Open style… / Save** — open a style file to tune, then **Save** writes your
  changes back to it (⌘/Ctrl-S). Uses the File System Access API where available,
  and falls back to **Download** / **Copy** (and an upload dialog) elsewhere — so
  it works on `file://` and over `desk:serve` alike.

## Fidelity

The preview isn't a lookalike — the paint logic is **ported from the engine**
(`src/caption.mjs` and the rig in `src/director.mjs`), so what you see is what
`nolan` renders. When the engine's look changes, update the ports in
`style-desk.html` (search for the "ported" comments) so the desk stays true.

Run `npm run desk:check` to assert the desk's ported caption constants
(`CAPTION_DEFAULTS` + presets) still equal the engine's — it fails loudly if they
drift. Good to wire into CI.

## Notes / limits (first cut)

- The presenter shows real AI-generated faces, inlined as `data:` URIs — the same
  trick `resolveCam` uses to fold a cast member's photo into the page past any
  CSP. The face picker lives in the Presenter section.
- The **Encode** block (viewport, ffmpeg outputs, subtitles) isn't exposed in the
  UI — it's rarely hand-tuned; edit it in the style file. (Deferred: Phase 2d.)
- A **loaded film's cast** shows coloured initials, because its `cam` is an asset
  *path* the desk can't read on its own yet (the bundled sample faces still show
  photos). Resolving film cam paths is a later pass (Phase 3 / directory access).

## Source of truth

`editor/style-desk.html` is the whole thing — one self-contained file, versioned
in the repo, edited and run locally. Plain HTML + inline CSS/JS on purpose:
open it, read it, hack on it.
