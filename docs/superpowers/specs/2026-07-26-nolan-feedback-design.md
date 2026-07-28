# `nolan feedback` — design

**Date:** 2026-07-26
**Status:** implemented, 2026-07-28

One addition the design didn't anticipate: node's own errors quote absolute
paths, so a friction footer built from an error message would have pre-written
the user's directory tree into the issue body — against the privacy rule above.
`redactPaths()` strips cwd and `$HOME` from *nolan-written* summaries only; the
user's typed message is still passed through literally.

## The problem

nolan-core has a feedback destination — the repo is public and `package.json`
already points `bugs` at `github.com/richardofortune/nolan/issues`. What it
lacks is *capture*. Nobody leaves a terminal mid-frustration to go file an
issue, and an agent driving nolan inside someone else's pipeline has no way to
report a limitation at all.

The goal is to shorten the distance between hitting friction and saying
something about it to one sentence typed where the user already is.

## Approach

Three parts, in order of how much each one matters:

1. **`nolan feedback "…"`** builds a prefilled GitHub issue URL and opens it.
2. **Friction footers** print a ready-to-run `nolan feedback` line at each point
   nolan reports bad news. This is the actual capture mechanism — part 1 is the
   pipe, part 2 is what makes anything flow through it.
3. **Issue templates** give people who arrive through the GitHub UI some
   structure. Low ceiling on their own; included as the landing surface.

Rejected: a webhook or hosted collector (needs a service to run and moderate,
and splits the conversation away from the repo where the fix lands), and a
state file remembering the last run (staleness, gitignore noise, and the
pre-written footer gets 90% of the value for none of the cost).

## The command

```
nolan feedback "<what happened or what you want>" [options]

  --print                 print the URL instead of opening a browser
  --with-context=<path>   attach a file (screenplay/style/segments) to the issue
```

Target URL:

```
https://github.com/richardofortune/nolan/issues/new
  ?labels=feedback
  &title=<first 70 chars of message, ellipsised>
  &body=<body, URL-encoded>
```

Body:

```markdown
Restyle can't move the caption to the top — only the colour changes.

---
<sub>nolan 0.1.0 · node v20.11.0 · darwin arm64 · filed with `nolan feedback`</sub>
```

With `--with-context=demo.screenplay.json`, the file's contents are appended in
a fenced block labelled with its basename, above the metadata footer.

Exit codes: `0` on success (URL opened or printed), `1` on a missing message
argument or an unreadable `--with-context` path.

## Privacy

Screenplays contain the customer's app URL and selectors. **Nothing about the
user's app is transmitted unless they pass `--with-context`.** The default body
carries only: nolan version, node version, `process.platform`/`arch`, and the
literal string the user typed. No cwd, no file paths, no screenplay contents,
no environment variables.

`--with-context` is an explicit, per-invocation opt-in. There is no config key
that makes it sticky — sticky context sharing is how people leak things they
forgot they turned on.

## The agent path

`--print` turns on automatically when `process.stdout.isTTY` is false or
`process.env.CI` is set. An agent running:

```bash
nolan feedback "restyle can't reposition captions, only recolour them"
```

gets the URL on stdout and no hijacked browser. It surfaces the link to its
human, who clicks submit. Same code path as the human case — no separate agent
mode to maintain.

This matters more than it looks: agents drive nolan more than humans do, so the
agent is usually the party that hit the limitation first-hand.

## Friction footers

Four call sites in `bin/nolan.mjs`, each printing one muted line after the
existing error output:

| Site | Pre-written summary |
|---|---|
| `verify`, `--on-drift=fail` (line ~112) | `verify: targets stopped resolving in <file>` |
| `verify`, `--on-drift=warn` (line ~116) | `verify: targets stopped resolving in <file>` |
| `lint` findings (line ~83) | `lint: <rule> fired on <file> and I disagree` |
| top-level `catch` (line ~132) | `<message>` |

Rendered:

```
The app moved under the screenplay. Update the beats, or the demo will lie.
↳ nolan wrong about this? nolan feedback "verify: targets stopped resolving in splitter.screenplay.json"
```

Rules:

- Failures only. Never on a successful run — success does not need a nag.
- One line, and it comes last, after the actionable error text.
- Suppressed by `--quiet`.
- The lint footer stays even though lint findings are the user's own writing,
  not a nolan bug: disagreement with a craft rule is exactly the signal the
  craft guide needs.

The top-level catch sits outside `main()` and has no access to the command or
file, so its summary is just the error message.

## Structure

New `src/feedback.mjs`:

```js
export function buildFeedbackUrl({ message, context, meta }) → string
export function openUrl(url) → Promise<boolean>   // false if it couldn't
```

`buildFeedbackUrl` is pure — no I/O, no platform lookups — so it is testable
without a browser. `meta` is passed in rather than read from `process` inside,
for the same reason.

`openUrl` spawns the platform opener (`open` on darwin, `start ""` on win32,
`xdg-open` elsewhere) detached with stdio ignored, and resolves `false` on any
failure so the caller can fall back to printing the URL. This mirrors the
existing `npm run desk` script, which already chains the same three commands.

`bin/nolan.mjs` changes: add `"feedback"` to the command list on line 54, add a
dispatch branch, add the four footers, add a `feedback` line to `USAGE`.

Note that `feedback` takes a free-text positional rather than a file path. Its
branch must therefore run *before* the `if (!file)` guard on line 57 and raise
its own missing-argument error — otherwise `nolan feedback` with no message
prints "no screenplay given", which is nonsense for this command.

## URL length

GitHub returns 414 on prefilled issue URLs somewhere past ~8KB. `buildFeedbackUrl`
handles this in two steps:

1. Context is capped at 4000 characters, truncated with a `…(truncated)` marker.
2. If the fully encoded URL still exceeds 6000 characters, context is dropped
   entirely and replaced with a line telling the user to attach the file to the
   issue by hand.

Both limits are constants at the top of the module.

## Issue templates

`.github/ISSUE_TEMPLATE/`:

- `bug.md` — what you ran, what happened, what you expected
- `idea.md` — what you were trying to do, what got in the way
- `config.yml` — `blank_issues_enabled: true`

That flag is load-bearing. A prefilled `issues/new?body=…` URL opens the *blank*
issue editor; with blank issues disabled, GitHub redirects to the template
chooser and the prefilled content is lost. Plain markdown templates are used
rather than issue *forms* (`.yml`) because forms only accept prefill via
field-id query params, which would couple the CLI to the form's internal ids.

## Testing

`test/feedback.test.mjs` on the built-in `node:test` runner (zero dependencies),
with `"test": "node --test test/"` added to `package.json`. This is the repo's
first test; the runner choice is deliberate so it stays dependency-free.

Cases:

- body contains the message and the metadata footer
- default body contains no file paths and no context
- title is truncated to 70 chars with an ellipsis; short titles are untouched
- `--with-context` content appears in a fenced block
- context over 4000 chars is truncated with the marker
- an oversized total drops context and substitutes the attach-by-hand line
- special characters (`&`, `#`, newlines, emoji) survive encoding

## Discoverability

- `feedback` line in `USAGE` in `bin/nolan.mjs`
- a short README section under the existing CLI documentation

## Files touched

| File | Change |
|---|---|
| `src/feedback.mjs` | new — ~40 lines |
| `bin/nolan.mjs` | dispatch branch, four footers, USAGE line — ~15 lines |
| `test/feedback.test.mjs` | new |
| `package.json` | `test` script |
| `.github/ISSUE_TEMPLATE/bug.md` | new |
| `.github/ISSUE_TEMPLATE/idea.md` | new |
| `.github/ISSUE_TEMPLATE/config.yml` | new |
| `README.md` | short section |

## Out of scope

- Any hosted collector, webhook, or Discord relay
- Telemetry or automatic reporting of any kind — every issue is filed by a
  human clicking submit
- In-editor feedback from the style desk (`editor/style-desk.html`); worth
  revisiting once the desk has real users
- Feedback routing or triage automation
