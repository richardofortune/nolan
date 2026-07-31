# Lexicon

**Status:** first pass, 2026-07-29. Written after an audit found two vocabularies
running in parallel across the two repos.

One word per idea. If two words mean the same thing, one of them is wrong. If one
word means two things, both uses are wrong.

## The root cause, before the words

The vocabularies did not drift apart by accident. They encode two different
products.

`nolan-studio/docs/vision.md` and `plan.md` were written on **24 July**. They
describe Studio as an authoring tool: define a kit, test it against demo
projects you picked, publish it.

`nolan/docs/studio-design-brief.md` was written on **28 July** and replaces that
model outright. Studio watches the stream the pipeline already produces. It
never holds sample material, and it is never in the production path.

So `kit / steer / gate / cascade` and `notice / say / reach / hold` are not two
halves of one system. They are the old model and the new one, both still live in
the repos. Renaming things without settling that just makes the disagreement
harder to see.

**Do this first:** rewrite `nolan-studio/docs/vision.md` and `plan.md` on the
current model, with a `What this replaces` section like the brief has. Then apply
the words below.

## The two layers

Every idea gets two names at most, and only when the layers genuinely differ.

**What people say.** The interface, the site, the sales conversation. A decision
is a sentence. Nobody sees a file, a rule id, or a version.

**What the system calls it.** Code, the CLI, file formats, this repo's docs.

The rule: no word may appear in both layers meaning different things.

## The canonical words

| The idea | People say | The system calls it | Retire |
| --- | --- | --- | --- |
| The thing that gets made | a walkthrough | `screenplay` (the instructions), `render` (making it) | demo, video, movie |
| Making one | nolan films it | `render` | generate, produce |
| The look | how it looks | `style` | look, template, theme |
| The person on screen | the presenter | `cast` (the set), `presenter` (the one used) | persona, guide, character |
| The writing standard | how we sound | `craft floor` | house rules, the craft, style guide |
| Checking the writing standard | (never shown) | `lint` | craft check, voice check |
| The four axes of it | (never shown) | the 4 Ts: tone, text, tempo, transitions | keep as is |
| What a team has settled | a decision | `rule` | policy, preference, setting |
| The per-use-case brief | (never shown) | `kit` | brief, pack, profile |
| The org-level identity | (never shown) | `house` | Brand, brand config |
| The kit compiled for the writer | (never shown) | `steer` | brief, prompt pack, context pack |
| The kit compiled for the check | (never shown) | `gate` | checks, validation, rules engine |
| Trying a change against history | reach | `replay` | impact, simulation, backtest |
| Letting a change apply | hold | `hold` | publish, enable, activate |
| Does the app still match | (never shown) | `verify` | drift check |

## The four collisions worth fixing

Ranked by what they will cost if left.

**1. `verify` means three things.** Core's `nolan verify` asks whether a
screenplay's targets still resolve against the live app. The Studio gate is
described as verifying a draft. And the developer-guide kit in `vision.md` uses
`verify` as a narrative beat, meaning show the reader it worked. This one will
bite in code, not just in prose.

Fix: `verify` belongs to core's drift check and nothing else. The gate gates. The
narrative beat is `confirm`, which the support kit already calls it.

**2. `look` and `style` are the same thing.** Core shipped `--style=`,
`*.style.json` and `styles/`, so it is public API. Studio's `vision.md` calls it
a look, and separately calls a starter look a template.

Fix: `style` everywhere. A template is a starter style, not a peer of anything.

**3. `persona` competes with `cast` and `presenter`.** Core already uses
`presenter` 18 times in `src/` and `cast` 42 times in `editor/`. Studio uses
`persona` 14 times for the same idea. Core wins on incumbency, and `persona` is
research vocabulary that the brief bans from the interface anyway.

Fix: `cast` is the set. `presenter` is the one appearing in a given walkthrough,
and carries a name, a face and a voice.

**4. `Brand` the object collides with brand the ordinary word.** Every sentence
about staying on brand now has to disambiguate. `vision.md` already reaches for
the better word when it says "your house brief, set up once".

Fix: rename the object to `house`. House style and house voice are the real terms
for exactly this, and they fit nolan's film metaphor. Brand goes back to being an
ordinary English word we can use freely.

Cost: `src/kit.mjs`, the `*.brand.json` fixtures, and `docs/brand.md` in
nolan-studio. Small, and it gets cheaper the sooner it happens.

If that rename is not worth it, the cheap alternative is a discipline: `House`
stays `Brand`, always capitalised, always a proper noun, never a bare noun in
system docs. Weaker, and it relies on everyone remembering.

## Two more gaps

**`reach` has no engine word.** It is the most important thing in the product and
nothing in either repo names the mechanic. Proposed: `replay`, since that is what
it does. It replays a proposed change over what already shipped.

**`brief` and `steer` are input and output of one idea.** A human writes the
brief, the compiler emits the steer. That is a real distinction, so both survive,
but the kit file currently calls its block `brief:` while everything downstream
says steer. Rename the block to `steer:` so the word survives the whole flow. An
action keeps its name through the whole flow, and so should a noun.

## What is not fragmentation

Worth naming, so we do not over-correct.

`craft floor`, `lint` and `the 4 Ts` are three different things: the standard,
the tool that enforces it, and the four axes it is measured on. Keep all three.

`notice / say / reach / hold` living only in the design brief is correct. They
are interface verbs and they are supposed to have no engine counterpart except
`replay`.

`walkthrough` and `film` doing different jobs is correct. One is the noun, one is
the verb.
