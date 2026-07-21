# nolan

**Direct your app. Get a film.**

Demo GIFs rot. You record one by hand, ship it, change the UI, and now your
README shows software that no longer exists. nolan makes the demo a **build
step**: a screenplay you version, re-run on every release, and re-style whenever
you like — filmed against your real app, in a real browser.

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

This split is the whole design.

| | Holds | Edited by |
|---|---|---|
| **Screenplay** `*.screenplay.json` | WHAT happens — beats, cast, the set | **an agent can generate this** |
| **Style** `styles/default.json` | HOW it looks and how fast — overlays, pace, transitions, click highlight, output formats | you, iterating over time |
| **Engine** `src/` | drives the browser, encodes | nobody |

Because the screenplay is data rather than code, a coding agent can write and
edit demos for you without writing scripts. Because style is separate, changing
the look of *every* demo you own is one file and a re-render.

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
| `say` | `text` | narrate — duration **derived** from length |
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

**Cuts:** tag any scene or beat with `cuts: ["full"]`. One screenplay, a tight
README hero and a long pitch cut, from a single recording pass.

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
- **Overlays are burned into the recording.** The engine emits a timing manifest
  but doesn't use it; compositing captions in post would make restyling a
  re-encode (seconds) rather than a re-film (minutes). Biggest remaining win.
- **No voiceover.** Timing is designed for it; no TTS wired.
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
