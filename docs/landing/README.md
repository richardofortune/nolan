# Landing page assets

Everything the [landing page spec](../landing-page-v1.md) asks for, and where it
came from. The spec's acceptance criteria says every product claim on the page
has to be demonstrated by a tracked nolan artifact — so nothing here is a mockup.
Each asset is either a real render or a real terminal capture, and every one of
them regenerates from a command in this repo.

## The assets

| File | What it's for | Made from |
|---|---|---|
| `assets/hero.mp4` + `hero-poster.jpg` | Hero media (spec §2) | `examples/out/showcase-full.mp4` — nolan explaining itself |
| `assets/support-answer.mp4` + poster | "Answer a real customer" panel (spec §5) | `examples/support-answer.screenplay.json` |
| `assets/shipped-change.mp4` + poster | "Ship a change people can follow" panel (spec §5) | `examples/shipped-change.screenplay.json` |
| `assets/verify-drift.svg` + `.txt` | Product-truth terminal (spec §4) | real output of `nolan verify` against `examples/drift/stale.screenplay.json` |
| `assets/verify-pass.svg` + `.txt` | The other half of "Keep the story true" (spec §5) | real output of `nolan verify` against `examples/support-answer.screenplay.json` |
| `assets/wordmark.svg` | Nav / header mark | typographic, no ornament |
| `assets/lockup.svg` | Standalone mark | the wordmark wearing nolan's own caption bar |

The `.mp4`s are muted, `+faststart`, H.264 / yuv420p, 1000×700 — they autoplay
inline on iOS and start rendering before the whole file has arrived. Posters are
real frames from the same render, chosen where a caption is fully on screen, so
the still says something before anyone presses play.

## Regenerating them

Film the two panel examples (both drive the bundled toy app in `examples/site`,
so they run offline on a fresh clone):

```bash
npm run example:support
npm run example:shipped
```

Then optimise for the web. `$SRC` is the render in `examples/out`, `$OUT` the
tracked asset:

```bash
ffmpeg -y -i "$SRC" -an -c:v libx264 -preset slow -crf 25 \
       -pix_fmt yuv420p -movflags +faststart -profile:v high -level 4.0 "$OUT.mp4"
ffmpeg -y -i "$SRC" -vf "select='eq(n\,270)'" -vframes 1 -q:v 4 "$OUT-poster.jpg"
```

The hero uses `crf 26` from `examples/out/showcase-full.mp4` (`npm run
example:showcase` rebuilds that source).

Raw renders stay in `examples/out/` and stay untracked — only these optimised
web copies are committed, so the repo carries one version of each asset rather
than two.

## The drift capture

`examples/drift/stale.screenplay.json` is **deliberately out of date and stays
that way.** It describes a Splitter that renamed "Work it out" to "Calculate
split" and had a `#tip` field. Neither is true of the app in `examples/site`, so:

```bash
npm run example:drift          # exits 1, on purpose
```

produces the failure in `assets/verify-drift.txt` verbatim. That's the point —
the landing page shows what drift looks like, and this is what it actually looks
like, not a hand-written approximation. Don't "fix" its targets.

It lives in a subdirectory so the `examples/*.screenplay.json` globs (the demo
linter, the onboarding menu) skip it.

## What the page still needs from a designer

Every asset the spec listed exists. Two things are decisions, not captures:

- The *Ship a change* panel's suggested visual is a **diagram**
  (`feature branch → screenplay → walkthrough → release note`), not a render.
- The *Answer a real customer* panel wants the support question and a screenplay
  excerpt set beside `support-answer.mp4`. The question it answers is "there were
  four of us, not three"; the excerpt should come from the real file, and its
  `{{who}}` / `{{party}}` vars are worth showing — that's the whole
  made-for-this-person claim, visible in three lines of JSON.
