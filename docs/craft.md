# Writing nolan walkthroughs — the craft guide

The engine drives a browser; anyone can do that. The **craft** — a walkthrough
that lands every time — is the value. This doc is the source of truth for that
craft. Read it before writing a screenplay; an agent authoring one should read it
too.

Four dimensions, the **4 Ts**: **Tone, Text, Tempo, Transitions.** Each has an
*enforceable floor* (mechanical — a linter catches it) and a *judgment layer*
(taste — you decide). Get the floor right always; spend your attention on the
judgment.

**The voice in one line:** a confident colleague showing you something they built
— not a salesperson, not a whitepaper, not an AI.

**Companion doc:** [`style-events.md`](./style-events.md) is the corpus of
on-screen devices — the cursor, click pulse, presenter bubble, and the how-to
progress rail — with the *why/when* behind each. Craft is the words; style
events are the visible chrome that makes an action legible. Reach for both.

---

## 1. Tone

How it sounds. The single biggest quality signal, and the easiest to get wrong.

**Rules (the floor):**
- **No em-dashes** (`—`). A period or comma instead. This is the #1 AI tell; one
  per line screams machine-written.
- **No forced triads.** The rule of three, overused, reads as AI. Say the real
  number of things. Usually one.
- **Use contractions** — "it's", "you'll", "here's", "that's".
- **No clichés or antithesis for its own sake:** "Show, don't tell", "not just X
  but Y", "it's not X, it's Y".
- **No hedging:** "may", "might", "could potentially", "generally". State it.
- **No AI vocabulary:** delve, realm, underscore, leverage, unlock, elevate,
  robust, meticulous, seamless, tapestry, testament.
- **Match the brand's voice** where one is defined (the voice-of-business).

**Judgment:** warmth, a little personality, the right register for *this* audience.

| Instead of… | Write… |
|---|---|
| "One command, and nolan narrates the build — beats, pace, seconds." | "Run it, and nolan tells you what it did." |
| "The full article — live, not a screenshot." | "Here's the full article, live." |
| "Show, don't tell — in your voice. This walkthrough made itself." | "That's it. Your voice, and it made itself." |

---

## 2. Text

The words on screen. A caption is read in a glance, not studied.

**Rules (the floor):**
- **One idea per caption.** If a second clause is showing off, cut it.
- **~6–12 words.** Shorter is usually better. Never a sentence you'd have to
  re-read.
- **Active voice.** "nolan films your app", not "your app is filmed".
- **Define acronyms or drop them.**
- **Everyday words.** If a simpler word exists, use it.
- **Address the viewer** ("you"), by name when it's personalised (`{{who}}`).

**Judgment:** is it the *right* word? Specific beats clever every time — name the
real thing rather than reaching for a punchy parallel.

| Instead of… | Write… |
|---|---|
| "Beach cottages, beach pods, and a studio with a suspicious 4.97 rating." | "There's even a beach studio rated a suspicious 4.97." |
| "Real cursor, real typing, real clicks." | "A real cursor, really typing." |

---

## 3. Tempo

The rhythm — how it moves. The most overlooked, and where amateur work shows.

**Rules (the floor):**
- **Write to length, not to a clock.** `say` derives its duration from the caption
  length (`readingSpeed`), so a shorter line *is* a faster beat. Don't hardcode
  timings to fake pace.
- **Let it breathe.** After a key beat or a payoff, pause — a `hold`, or just no
  caption. Silence does more work than another line.
- **Don't narrate every action.** Show some things with no caption at all.
- **One caption per action, never two in a row on the same point.**
- **Vary the cadence.** Not every line the same length. A short line hits harder
  after a longer one.
- **Arc:** hook → build → payoff. Open on the hook, end on the payoff, then
  `hold` so it lands.
- **Match pace to content.** Setup can be brisk; the payoff can linger.

**Judgment:** is the pause in the *right* place? Does the whole thing build, or
just accumulate?

> Anti-pattern we hit: two consecutive captions both explaining CI/`verify`. One
> idea, one caption — the second was noise.

---

## 4. Transitions

How scenes join. Jank here destroys the "polished" feel instantly.

**Seamless is non-negotiable** — the engine now enforces it (cuts navigate under
cover and rig while hidden; the presenter and cursor persist across scenes; the
cursor glides in rather than teleporting). Never ship a blink, flash, or pop-in.
If you see one, it's a bug — fix it, don't accept it.

**Pick the right transition for the moment:**
- **`cut`** (curtain) — a real scene change: a new page or context. Buys a beat of
  "somewhere else".
- **`card`** — a titled pause: an intro or a chapter marker.
- **`hold`** — not a transition, the tempo tool: let a beat land within a scene.
- **plain `goto`** — a hard jump with no ceremony. Rarely what you want mid-flow.

**Rules (the floor):**
- **The curtain must read.** Don't fade a dark scene into a dark curtain into a
  dark scene — no contrast, no transition. A mid-tone or brand-colour curtain
  bridges dark↔light both ways.
- **Don't over-cut.** Back-to-back cuts feel choppy. Earn each one.
- **Consistent cut titles** — all numbered or none, and short. A lone "1)" with no
  sibling reads as a mistake.

**Judgment:** is this the right transition *emotionally* for the moment?

---

## The pre-film checklist

Before you film, read the captions **out loud**, then:

- [ ] **Tone** — zero em-dashes? zero forced triads? contractions? no clichés or
  AI words? sounds like a person?
- [ ] **Text** — every caption one idea, ~6–12 words, specific, active?
- [ ] **Tempo** — does it breathe? any two captions doing the same job? does it
  build to a payoff, then hold?
- [ ] **Transitions** — each one earned, the right kind, and seamless? curtains
  read against their scenes?

If a line makes you hesitate when you say it, rewrite the line, not the delivery.

---

## How this guide grows

Craft compounds only if we write it down. Every time we learn something, encode
it so the next screenplay inherits it and quality never regresses:

```
film → watch → note what's off → encode the fix
                                   ├─ mechanical? → a lint rule
                                   ├─ engine?     → a default (e.g. seamless cuts)
                                   └─ taste?      → a rule in this guide
```

This document is the taste layer. `nolan lint` (planned) is the mechanical floor
that enforces the rules marked *(the floor)* above. The engine holds the defaults
that make good output automatic. Add to whichever fits — the craft only ratchets
up.
