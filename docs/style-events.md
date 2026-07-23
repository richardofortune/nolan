# Style events — the corpus

A growing catalogue of nolan's **on-screen devices**: the cursor, the click
pulse, the presenter bubble, the progress rail, cards. Each entry says what the
device *is*, **why** it exists, **when** to reach for it (and when not), and the
knobs that drive it.

This is the companion to [`craft.md`](./craft.md). Craft is about the *writing*
(tone, text, tempo, transitions); this is about the *visible chrome* that makes
an action legible. Both compound: every time we learn why a device works, we
write it down here so the next film starts ahead of the last one.

## The one principle behind all of them

**Show the viewer where to look, and prove the action happened.** A demo film
has no narrator leaning over the desk saying "watch this bit." The chrome does
that job. If a non-technical viewer — think of explaining a public service to
your nan — can't tell *what just happened* or *where we are*, the device has
failed, however tasteful it looks.

## Two classes of chrome: burned vs restyleable

A design line runs through the engine, worth knowing before you touch a style:

- **Motion / chrome is burned into the film in both modes** — the cursor, the
  click pulse, the presenter bubble, the progress rail. It belongs to the
  *action*, not the page, so it is filmed once and can't be restyled after.
- **The caption bar is the one restyleable layer.** In `post` mode it is left
  off the master and composited on afterwards, so re-skinning captions is a
  re-encode, not a re-film (see `composite.mjs`).

Rule of thumb: if the device tracks *what the app is doing*, it's burned. If it
tracks *what we're saying about it*, it's a caption.

---

## Cursor

**What** — a burned-in arrow that glides to each target (`move`, `click`).
**Why** — the eye follows motion. Gliding (never teleporting) tells the viewer
*where attention is going* before anything happens there.
**When** — whenever you interact with a real element. It's on by default.
**Notes** — the cursor is initialised off-screen (`-100px`) so it never flashes
at 0,0 on the first frame. Glide duration is `ms` on the beat.

Knobs: `cursor.show`, `cursor.size`, `cursor.fill`, `cursor.stroke`.

## Click pulse

**What** — on every `mousedown`, a **filled tap-flash** blooms at the point,
wrapped by one or two **expanding rings** that fade out.
**Why** — this is the "prove it happened" device. A bare cursor sitting on a
button doesn't read as a *click* — the press is invisible. We learned this the
hard way: the first version was a single thin 2.5px ring, 46px wide, gone in
450ms, yellow-on-blue. On a frame grab you could barely find it. The fix that
mattered was the **filled dot** — a solid flash reads as "pressed *here*" far
more strongly than an outline, especially for a non-technical viewer.
**When** — automatically, on any `click` beat. You rarely think about it; you
tune it when the film's palette fights the default colour.
**When not** — if a style has a very busy background, drop `rings` to 1 so the
pulse doesn't add clutter; the filled dot alone still carries it.

Knobs (`cursor.click`): `colour`, `from`→`to` (ring start/end diameter),
`width`, `ms`, `dot` (filled flash on/off), `dotTo` (its final size),
`rings` (1 or 2 — two gives a sonar double-pulse).

Design defaults today: `from:14 to:62 ms:520 width:3 dot:true dotTo:34 rings:2`.
Reasoning: bigger and slower than the original so the eye *catches* it, a solid
core for legibility, a second ring for a deliberate "click" feel.

## Presenter bubble

**What** — a webcam-style circle of the current actor in a corner, the way a
screen-share shows the person talking.
**Why** — warmth and authorship. A friendly face turns an automated capture into
*someone showing you something*. It's the difference between documentation and a
person helping.
**When** — walkthroughs aimed at people, especially non-technical audiences
(the "explaining to nan" register). A named human `cast` member with a `cam`.
**When not** — dense technical or product-tour films where the face competes
with the UI for attention; leave `presenter.show` off and let captions carry it.
**Notes** — built lazily on the first `actor` (so no empty ring flashes), and
re-applied on every re-rig so it persists across scene changes. It lifts clear
of the caption bar automatically.

Knobs (`presenter`): `show`, `corner`, `size`, `shape`, `ring*`, `shadow`,
`label`. Face assets live in `examples/assets/people/`.

## The how-to format

A how-to walkthrough has a few parts. Two are essential; the rest are optional —
turn them on when the audience or the material benefits.

| Part | Required? | Device |
| --- | --- | --- |
| **State the plan up front** | yes | an opening caption ("…four small steps") |
| **Step through in order, breathing between steps** | yes | `say` + `hold`, tempo per craft.md |
| **Steps tracker — show where we are** | **optional** | the progress rail (below) |
| **A friendly guide** | optional | the presenter bubble |
| **Prove each action** | optional | the cursor + click pulse |

The steps tracker is **opt-in**: a how-to reads fine without it. Switch it on
(`steps.show` + a screenplay `steps[]` array) when the procedure has 2–5 discrete
stages and the audience benefits from a map — non-technical viewers especially.
Leave it off for a single-idea demo or anything over ~5 steps.

## Progress rail (the steps tracker)

**What** — a row of step chips, top of frame: the current step highlighted,
completed steps checked off green, upcoming steps dimmed. This *is* the optional
"steps tracker" from the format table above.
**Why** — the strongest lesson from real how-tos: **state the plan up front,
then step through it, and always show where we are.** A viewer who can see
"3 steps, we're on 2" never feels lost, and knows the film is nearly done. It
replaces the temptation to write `Step 1:` / `Step 2:` into the captions (an
AI-tell we banned in craft.md) — the *rail* carries the numbering, so the
captions stay conversational ("First, come to govt.nz…").
**When** — any procedural how-to with 2–5 discrete stages. It shines for
non-technical audiences who benefit from a map.
**When not** — a single-idea demo, a product sizzle, or anything with more than
~5 steps (the rail gets cramped; break it into cuts instead).

**How it's driven** — labels are declared once on the screenplay
(`"steps": ["Go to govt.nz", "Find your topic", "Open your card"]`) and the rail
appears from the first frame showing the whole agenda. A `step` beat advances
it: `{ "do": "step", "n": 2 }`. A final `step` with `n` past the last label
marks everything complete. It persists across `goto`/`cut` like the presenter.

Knobs (`steps`): `show`, `corner` (`top` | `top-left` | `top-right`),
`bg`, `ink` (upcoming), `active` (current), `done` (completed).

**Pattern to copy** (from `examples/supergold.screenplay.json`):

1. Open by *saying* the plan — "…takes three small steps." The rail is already
   on screen showing all of them, so words and chrome reinforce each other.
2. `step 1` → do it → breathe (`hold`).
3. `step 2` → do it → breathe.
4. `step 3` → do it.
5. `step 4` (past the end) → everything checks green. A quiet sense of "done."

## Card

**What** — a full-screen title card (`card` beat) between scenes.
**Why** — a hard chapter break, or a spoken-plan moment you want to land with no
app behind it. An alternative to the rail when the agenda deserves its own beat.
**When** — opening/closing bumpers, or a big "Part 2" divider. For step-by-step
progress prefer the rail (it stays on screen); use a card for punctuation.

---

## How to add to this corpus

When we discover *why* a device does or doesn't work — a legibility fix, a
timing that finally felt right, an audience it's wrong for — add or amend an
entry here in the same shape: **What / Why / When / When not / Knobs.** Keep the
reasoning, not just the setting. A number without its reason gets tuned away by
the next person; a reason compounds.
