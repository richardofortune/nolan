# `expect` — design

Assert on what the app actually put on screen, so a walkthrough can't narrate a
number the app never produced.

**Status:** design only. Nothing implemented.

## The problem

nolan has two gates and they cover different things:

- `lint` reads the screenplay and asks *is this written well?*
- `verify` drives the browser and asks *do the targets still resolve?*

Neither asks *is what we said true?*

This was found by following the README's agent prompt end to end against the toy
app. The screenplay passed both gates and the film still lied:

| the caption said | the screen said |
|---|---|
| "Ana's square. Everyone else owes her 120." | Bo owes Ana 160.00 · Cass owes Ana 160.00 |

The beat moved the cursor to the "Split between" dropdown without changing it, so
the split stayed at three ways: 480/3 = 160. The caption asserted 120, which is
the four-way answer. Both tools behaved correctly. `lint` had no complaint — the
sentence is clean. `verify` had no complaint — every selector resolved.

This is the failure that matters most in the walkthroughs nolan is for. A support
how-to exists to tell someone what they will see. If it tells them the wrong
number, the demo is worse than none: it teaches a falsehood in the product's own
voice, and it does it convincingly, because everything around it is real.

It is also the mistake an **agent** is most likely to make. Producing a plausible
figure without checking is the characteristic language-model error, and the agent
writing the screenplay is exactly the party the other two gates are protecting
against.

## Approach

Let a beat state what it expects to be on screen, and fail if it isn't.

```jsonc
{ "do": "click", "to": { "role": "button", "name": "Work it out" },
  "expect": "owes Ana 160.00" }
```

The narration and the assertion sit in the same file, next to each other, so
they drift together or not at all. Putting the assertion anywhere else means the
caption can be edited without the check being revisited, which is how this class
of bug survives.

Three properties this has to keep:

1. **Opt-in.** A screenplay with no `expect` behaves exactly as today. Making it
   mandatory would break every existing demo and punish the quick ones, where it
   isn't worth it.
2. **Runs under `verify`, not only at film time.** The point is failing in CI in
   the second or two `verify` already takes, not after a render.
3. **Same drift vocabulary as targets.** `--on-drift=fail|warn|refresh` already
   distinguishes "your bug" from "a site you don't own". Content drift is the
   same question and should get the same answer.

## Shape

`expect` accepts a string or an array of strings. A string is matched against the
visible text of the page, normalised for whitespace and case, after the beat's
`settle`.

```jsonc
"expect": "owes Ana 160.00"
"expect": ["owes Ana 160.00", "paid 480.00"]
```

Scoping to a region, where the whole page is too loose:

```jsonc
"expect": { "in": { "sel": "#result" }, "text": ["Bo", "owes Ana 160.00"] }
```

Asserting something is *gone* — a spinner cleared, an error dismissed:

```jsonc
"expect": { "absent": "Enter a total" }
```

Vars interpolate, so an assertion can be derived rather than hardcoded:

```jsonc
"vars": { "total": "480", "each": "160.00" },
"expect": "owes Ana {{each}}"
```

That last one is worth having but is not a substitute for reading the film. A var
can be as wrong as a literal.

## What it reports

Matching `verify`'s existing voice, which names the beat and says whose problem
it is:

```
✗ 1 expectation not met:

  [walkthrough] click "Work it out": expected "owes Ana 120.00"
    on screen: "Ana paid 480.00 — settled · Bo owes Ana 160.00 · Cass owes Ana 160.00"

The walkthrough says something the app doesn't. Fix the caption, or the beats.
```

Printing the surrounding on-screen text is the whole value. "Expected X, not
found" sends the author back to the browser; showing what *was* there usually
makes the fix obvious, and in this case would have shown 160 immediately.

## Why not infer it from the captions

Tempting: read `say` text, find numbers, check they appear on screen. It needs no
new syntax and would have caught this exact bug.

Rejected. It is guessing at intent. "Four small steps" and "we've got 99 of them"
are numbers nobody expects on screen, so it would fire constantly on correct
screenplays, and a gate that cries wolf gets bypassed — which costs more than the
bug. An explicit `expect` says precisely what the author meant.

Worth revisiting only as a **warning** once `expect` exists, so the two don't get
confused: `expect` is the floor, inference would be a nudge toward using it.

## Interaction with `--on-drift`

- `fail` *(default)* — a missed expectation exits non-zero. The CI gate.
- `warn` — report, exit 0. Right for a site you don't own, where the copy can
  change and you can't do anything about it.
- `refresh` — re-render if the demo still resolves. A missed expectation should
  **not** refresh: a target moving is mechanical, but content disagreeing means
  the words are wrong, and re-rendering would just produce a fresh lie. Treat it
  as `fail` under `refresh`.

## Scope of a first cut

Enough to catch the bug that prompted it, and no more:

- `expect` as string or array of strings, matched against visible page text
- `{ "in": …, "text": … }` for scoping
- checked during `verify` and at film time
- one clear failure report showing the on-screen text
- `--on-drift` respected, with `refresh` treated as `fail`

Out of scope for a first cut: `absent`, regex matching, numeric tolerance,
asserting on attributes or computed styles, and screenshot diffing. Each is
defensible; none is needed to stop a walkthrough narrating a number the app
never produced.

## Files this would touch

- `src/director.mjs` — evaluate `expect` after a beat's `settle`; reuse the
  existing target-resolution plumbing rather than adding a second way to read the
  page
- `src/render.mjs` — carry results through `verify` alongside target resolution
- `bin/nolan.mjs` — reporting, exit codes, `--on-drift` handling
- `src/lint.mjs` — nothing. `expect` is not a craft rule
- `docs/craft.md` — a line under Text: assert the numbers you narrate
- `README.md` — replace the step 8 caveat with the real mechanism
- `test/expect.test.mjs` — matching and normalisation are pure and worth pinning

## Open question

Should a beat be able to assert *before* it acts, not just after? "The button is
disabled until a total is entered" is a real thing a how-to demonstrates, and
today there's no way to state it. Probably `expectBefore`, probably not in a
first cut, but the syntax should not paint us into a corner if it lands later.
