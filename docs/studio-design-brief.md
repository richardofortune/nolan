# Nolan Studio — design brief

**Status:** brief, no designs yet
**Date:** 2026-07-28

## What Studio is

Open-source **nolan** is the engine: screenplay in, filmed walkthrough out. Run
bare, it produces a competent generic walkthrough.

**Studio is the paid layer: a team-licensed control plane for *kits*.** A kit is
brand + persona(s) + locale(s) + per-use-case instructions + a craft floor.

The thing to hold onto, because it shapes every screen: **Studio is never in the
production path.** The customer's own pipeline AI makes the films people
actually receive, at runtime, in their product. Studio makes *the instructions
those films are made from*. Nobody sits in Studio waiting on a customer's
walkthrough. They sit in Studio deciding what every future one will sound like.

Studio does film, but only ever **demo projects**, and only to answer "what did
that change do". That is the test leg of define → test → publish, and it runs at
two speeds:

| | What it is | What it shows | Cost |
|---|---|---|---|
| **Preview** | paint logic ported from the engine, no browser | wording, presenter, captions, reading time | instant, per keystroke |
| **Film a test** | the real engine, on demo projects | everything, including tempo and transitions | seconds to minutes, queued |

The fast half is proven: the style desk's previews are ported from
`src/caption.mjs` and the rig, and `npm run desk:check` fails if they drift from
the engine. But a preview cannot show a cut, a hold, or how a walkthrough feels
in motion, and **tempo and transitions are two of the four Ts**. That is the
honest reason publishing waits on a real test rather than on a preference: half
the craft is invisible in a still.

## Who it's for

Two users, and they arrive months apart.

**The developer** wires nolan into their pipeline once. Their win is walking
away. Today they're the bottleneck: every team's stylistic request routes
through them to triage, implement, and troubleshoot, and every new level of
specificity is another thing they hand-build and maintain.

**Domain teams** — support owns the support kit, marketing owns the feature-tour
kit — arrive after the wiring and never touch the pipeline. They refine the
outputs they own. They are not developers and will not be taught JSON.

Studio sells three things at once: autonomy to domain teams, relief from being
the bottleneck to the developer, consistency and scale to the org.

## The core mechanic to make visible

The pipeline AI is the **writer** — free to script each task as it sees fit. The
kit is the **director's brief** laid over that freedom.

Getting a guarantee out of a free writer takes two touchpoints:

```
steer in  →   the kit conditions the draft      (instructions, brand, persona, locale)
gate out  →   a conformance check before ship   (the craft floor, promoted from
                                                 nolan's CLI linter to a pipeline guard)
```

**Freedom plus guarantee = steer plus gate.** A design that shows only the
steering half misses why anyone would trust this. The gate is the product's
spine, not a settings page.

## The jobs, in order

1. **Define** a kit — from "everything sounds like us" down to "our webhook
   guide, for enterprise, in Japanese." Depth is a dial, not a fork in the road.
2. **Test** it against demo projects — see what this kit does to a real
   walkthrough before anyone else gets it.
3. **Publish** — the pipeline picks it up. Versioned, reversible, and obvious who
   changed what.

A fourth surface falls out of testing: **the timeline**. It is a way into the
brief, not a film editor, and the difference is the whole point. Scrub a filmed
test, stop on a moment, and see which kit phrase and which floor rule produced
what is on screen. Change it there and the change lands in the kit, with the
strip marking every other moment, across every demo project, that the same
phrase just moved. You are not fixing this walkthrough. You are finding the
instruction through it.

It is also the only surface where holds and cuts are visible as gaps, so it is
where tempo stops being an abstraction. The style desk already has a timeline
for one film, which is a useful starting point and the wrong scope.

Granularity is the interesting design problem. A kit can inherit from a parent
("company voice") and override one axis for a niche. Most tools make this a
folder tree and lose everyone. It's closer to how a house style and a section
style relate on a magazine.

## Design constraints

- **Do not organise around the schema.** The existing `editor/style-desk.html` is
  a preview tool for one corner of *define* (the look), and its own critique is
  that it's a form over the style JSON. It maps sections 1:1 to config blocks.
  That's the anti-pattern to design away from: organise around what the human is
  trying to do, not around what the file contains.
- **Show the effect, not the setting.** Every change is only meaningful as its
  effect on a walkthrough. A kit edit that doesn't visibly change something is a
  dead control.
- **The craft floor is content, not preferences.** The rules are written down
  (`docs/craft.md`, the four Ts — tone, text, tempo, transitions) and machine
  checked (`nolan lint`). Domain teams should be able to argue with a rule, see
  what it rejects, and tighten or loosen the gate for their kit.
- **Localisation is deep, not a language dropdown.** Locale carries its own
  personas, formats, and pacing.
- **The output carries the colour.** Per the landing spec's visual direction:
  dark editorial base, calm sans, monospace for anything machine-shaped, and no
  gradient-and-dashboard chrome competing with the walkthroughs on screen.

## Voice

Nolan's own writing rules apply to Studio's interface copy, and the linter
enforces them on walkthroughs, so the product would look silly breaking them:
no em-dashes, contractions, no hedging, one idea per line, no AI vocabulary
(delve, leverage, unlock, robust, seamless), no forced triads. A confident
colleague showing you something they built.

Say `walkthrough`, `real app`, `screenplay`, `kit`, `change`, `people`.

## What already exists to build on

| | |
|---|---|
| `editor/style-desk.html` | working local editor: caption/variants, cursor, presenter with cast faces, steps, transitions with a cut preview, timing, templates, timeline. Its paint logic is ported from the engine, so its previews are faithful. |
| `docs/craft.md` | the four Ts, floor vs judgment layer |
| `src/lint.mjs` | the mechanical floor, today a CLI command |
| `docs/landing/assets/` | real renders and marks — the visual identity |

## Success

Someone in a support team, who has never opened the pipeline, changes how every
support walkthrough sounds, sees the effect on a real one, publishes it, and the
developer never hears about it.

## Out of scope for v1 designs

Billing and licence administration, the pipeline integration itself, anything
that films or renders inside Studio, and analytics.

## Open, and worth a designer's opinion

1. Is the primary object a **kit** or a **use case**? "Support walkthroughs, in
   Japanese, for enterprise" is arguably a use case that *has* a kit.
2. How does inheritance surface without becoming a folder tree?
3. Where does the gate live — a step in publishing, or a standing dashboard of
   what it has been rejecting?
