# nolan

**Let your agents show, not just tell.**

![nolan, demonstrating itself](examples/out/showcase-full.gif)

*The GIF above is a nolan walkthrough — generated from a spec, filmed against a
real app, narrating its own features. Rebuild it with `npm run example:showcase`.*

Nolan turns a short spec into a narrated walkthrough of your real app — a feature
tour, a bespoke answer to a support question, a look at something an agent just
built and wants to show you. What it *shows* is generated fresh for each person
and moment. How it *looks and speaks* — your colours, your captions, and (soon)
your voice — lives in a separate document your agents reuse and refine. So the
content stays personal while the delivery stays unmistakably yours.

```bash
nolan demo.screenplay.json --cut=hero
```

```
· filming "Splitter — settle up after a trip" — cut: hero (pace 0.65)
· encoding gif → out/splitter-hero.gif
· encoding mp4 → out/splitter-hero.mp4
✓ 12 beats · 9.6s
```

## Why not just record your screen?

Because you'll have to do it again. And again. Every release.

| | screen recorder | nolan |
|---|---|---|
| Re-shoot after a UI change | record it by hand, again | `nolan demo.json` |
| Restyle the captions | re-record everything | edit one style file |
| A shorter cut for the README | edit the video | `--cut=hero` |
| Demo drifts out of date | you find out from a user | **CI fails** |

That last row is the one that matters if you use this for help docs.

## Try it

Requires Node ≥ 18, `ffmpeg`, and Playwright's Chromium.

```bash
git clone https://github.com/richardofortune/nolan && cd nolan
npm install playwright && npx playwright install chromium
npm run example
```

That films the bundled toy app in `examples/site` — no other setup, nothing to
configure.

## Three documents, three owners

The split is the whole point. What you *show* is generated per person and moment;
how it *looks and speaks* is your brand — held apart so it becomes an asset every
walkthrough inherits.

| | Holds | Who owns it |
|---|---|---|
| **Screenplay** `*.screenplay.json` | WHAT to show — beats, cast, the set | **an agent writes it**, per feature or per recipient |
| **Style + voice** `styles/*.json` | HOW it looks and speaks — captions, presenter, pace, brand colours, output formats *(voice / TTS next)* | your **voice-of-business**, refined over time |
| **Engine** `src/` | drives the browser, films, narrates | nobody |

Because the screenplay is data rather than code, an agent can author a fresh
walkthrough for each person or moment without writing scripts. Because the
voice-of-business lives in one place, every walkthrough any agent makes inherits
it — improve it once, improve them all.

## A screenplay

```json
{
  "title": "Splitter", "slug": "splitter",
  "cuts": { "full": { "pace": 1 }, "hero": { "pace": 0.65 } },
  "cast": { "user": { "kind": "human", "name": "Ana", "bg": "#4f46e5", "ink": "#fff" } },
  "set": {
    "servers": [{ "cmd": "python3", "args": ["-m", "http.server", "8099"], "cwd": "site" }],
    "waitFor": ["http://localhost:8099/index.html"]
  },
  "scenes": [{
    "id": "walkthrough",
    "beats": [
      { "do": "goto",  "url": "http://localhost:8099/index.html" },
      { "do": "actor", "who": "user" },
      { "do": "say",   "text": "Put in what the trip cost." },
      { "do": "click", "to": { "sel": "#total" } },
      { "do": "type",  "text": "480" },
      { "do": "say",   "text": "Then work it out." },
      { "do": "click", "to": { "role": "button", "name": "Work it out" } },
      { "do": "hold",  "ms": 900 }
    ]
  }]
}
```

### Beats

| `do` | Fields | |
|---|---|---|
| `goto` | `url` | navigate |
| `cut` | `url`, `title`, `ms`, `after[]` | curtained scene change |
| `card` | `lines[]`, `ms` | full-screen title card |
| `actor` | `who` | set the persona chip |
| `say` | `text`, `as` | narrate — duration **derived** from length; `as` picks a caption variant |
| `hold` | `ms` | explicit pause (scales with pace) |
| `move` / `click` | `to` | glide the cursor, optionally click |
| `type` | `text`, `delay` | keyboard input |
| `scrollTo` | `to` | centre a target |
| `call` | `fn`, `args[]` | invoke a function on the page |
| `http` | `method`, `url`, `as` | real backend call; bind the response |
| `set` | `name`, `from`, `where` | derive a variable from bound data |
| `js` | `code` | escape hatch |

**Targets:** `{sel}` · `{role, name}` · `{shadow}` / `{shadowText}` (with
`set.shadowHost`) · `{x, y}`. Prefer `role` + `name` — it survives refactors,
which is what keeps a walkthrough usable as documentation.

**Interpolation:** any string takes `{{var.path|filter}}`
(`truncate:n`, `upper`, `plural:one:many`).

### Styled captions

A caption's *look* lives in the style file, never in the screenplay — the same
split as everything else. The style file picks a **preset** (`docs`, `karaoke`,
`highlight`, `minimal`) for the whole film, and defines **variants**: small,
named looks a single line can opt into.

```jsonc
// styles/default.json
"caption": {
  "preset": "docs",
  "backgroundColor": "#16181D", "color": "#F2F3F5", "size": 18,
  "variants": {
    "warn":  { "backgroundColor": "#3A2A0B", "color": "#FFC53D" },
    "aside": { "color": "#9AA0AA", "showChip": false, "italic": true }
  }
}
```

```jsonc
// screenplay — names the intent, not the paint
{ "do": "say", "text": "This deletes the trip. No undo.", "as": "warn" }
```

The screenplay says *this line is a warning*; the style file owns what a warning
looks like — same reason `{role, name}` targets beat `{sel}`. Change the look of
every warning in every demo you own by editing one file.

Fields are flat scalars (`size`, `fontWeight`, `backgroundColor`,
`backgroundOpacity`, …) rather than CSS shorthand, so one axis changes without
touching the rest. The `karaoke` and `highlight` presets light up a word at a
time — and because captions are *authored*, the word timing is derived from
length, with no speech recognition. Old `bg` / `ink` / font-shorthand style
files keep working; they're migrated on load.

**Cuts:** tag any scene or beat with `cuts: ["full"]`. One screenplay, a tight
README hero and a long pitch cut, from a single recording pass.

## Restyle without re-filming

Driving the app is the slow part; the captions are the part you fiddle with.
So `--overlay=post` films the app **clean** and composites the captions on
afterwards, keeping the clean master and a segment manifest next to the outputs:

```bash
nolan demo.screenplay.json --overlay=post
```

Now a new look is a re-encode, not a re-film — no browser, no app, seconds:

```bash
nolan restyle out/splitter-hero.segments.json --style=styles/dark.json
```

The segments are Cap-shaped (`{ id, start, end, text, as, actor }`). Word-level
animation survives compositing: a karaoke or pill-highlight caption is rendered
as a short frame sequence — one still per word-state — and each is overlaid on
its sub-window, so the words light up in post just as they do burned in. (The
per-character typewriter reveal is the one thing still drawn resting in post.)

### Subtitle sidecars

Every render also drops `.srt` and `.vtt` next to the film — the caption text is
authored and its timing is derived, so a subtitle track is just the segment
manifest in another shape. That makes a demo **searchable** and **screen-readable**
instead of pixels-only, for free. WebVTT carries the speaker as a `<v Name>`
voice tag. Choose formats (or opt out) in the style file:

```jsonc
"encode": { "subtitles": ["srt", "vtt"], "outputs": [ /* … */ ] }
```

### A presenter in the corner

Turn on a screen-share-style webcam bubble showing whoever's currently speaking —
off by default, opt in from the style:

```jsonc
// style
"presenter": { "show": true, "corner": "bottom-right", "size": 140, "shape": "circle" }
```

The person is the current **actor**. Give a cast member a `cam` for a real
headshot; without one they get a coloured avatar of their initial:

```jsonc
"cast": { "host": { "kind": "human", "name": "Mia", "bg": "#1A73E8", "cam": "./mia.jpg" } }
```

It's burned in like the cursor, so it works in both burn and post modes, and it
lifts clear of the caption bar automatically. (The rig is Trusted-Types-safe, so
the bubble — and every overlay — renders even on strict sites like Google.)

## Demos that fail CI when they go stale

```bash
nolan verify demo.screenplay.json
```

Resolves every target, films nothing, exits non-zero if the app moved:

```
✗ 2 target(s) no longer resolve:

  [walkthrough] click: no visible element matching "#amount"
  [walkthrough] click: no visible button named "Calculate split"

The app moved under the screenplay. Update the beats, or the demo will lie.
```

Takes a second or two. Put it in CI and your walkthroughs can't quietly start
lying to users.

## Timing is derived, on purpose

`say` computes its own duration from the caption length. It is never hardcoded,
so when voiceover lands, duration becomes real audio length and **every
screenplay you already wrote re-times itself** — no re-authoring.

## Status

Early. It works and it's in real use, but expect rough edges.

**Not done yet:**
- **Narration is text, not yet voice.** This is the "voice" half of the
  voice-of-business, and the biggest thing ahead. Timing already derives from
  caption length (see below), so when TTS lands — narrating in your brand's
  voice, personalised to the recipient — duration becomes real audio length and
  every walkthrough you already have re-times itself, no re-authoring.
- **No schema validation** — a malformed screenplay fails at the beat, not at load.
- **The `js` escape hatch is arbitrary code.** Needed today for ad-hoc DOM
  tweaks; treat agent-generated `js` beats with the same scrutiny as any
  generated code, and don't accept screenplays from people you don't trust.

## Prior art

[VHS](https://github.com/charmbracelet/vhs) does this beautifully for terminal
apps and is the direct inspiration — nolan is the browser-shaped version.
[Pagecast](https://github.com/mcpware/pagecast) records a browser via an AI
agent, aimed at one-off demos with automatic effects; nolan is the opposite
axis — authored, deterministic, re-runnable.

## Licence

MIT
