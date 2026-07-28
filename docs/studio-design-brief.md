# Nolan Studio — design brief

**Status:** brief, second model. The first one was authoring-shaped and is
recorded at the end so we don't walk back into it.
**Date:** 2026-07-28

## What Studio is for

Open-source **nolan** is the engine: a screenplay in, a filmed walkthrough of a
real app out. A customer wires it into their pipeline, and from then on their own
AI writes and films walkthroughs continuously, in response to real events. A
customer asks a question. A feature ships. Something gets explained.

**Studio's job is to make that stream better over time.** It earns its place by
uplift, not by ownership.

## The one structural fact

**Studio is not the source, and can never be.** The pipeline produces more in a
day than anyone can curate in a month. Anything Studio holds as a sample is stale
before it is looked at, and any design that asks a person to assemble the
material they want to reason over has already failed, because nobody knows what
to assemble.

So Studio never asks for input material. It watches what the pipeline is already
making.

## The loop

**Notice. Say. Reach. Hold.**

**Notice** a moment in something that actually went out. Not a demo, not a
sample. The real thing, with the customer's name still on it.

**Say what is wrong**, in the words you would use to a colleague. "Too pushy."
"We don't say seamless." "That pause is too long." "Don't open on the price."
Nobody types a threshold. Nobody picks a rule from a list.

**Reach** is where Studio does the work nothing else can. It replays the change
across what has already gone out and reports the truth: *this would have changed
43 of the last 200 support walkthroughs. Here are six of them.* You watch a
couple, and you know what you are actually asking for.

**Hold.** It applies from here on, and it keeps applying, because a fast writer
with no memory will drift back within a week.

## Why reach is the product

Everything else in this space is a settings screen that promises an outcome.
Reach *shows* the outcome, against real history, before you commit. It is the
only honest answer to "what will this do", and it is only possible because the
pipeline has already made thousands of things.

Two problems disappear with it. **Nobody assembles a test set**, because impact
is measured backwards over what already happened. And **nothing goes stale**,
because you are looking at real output rather than a synthetic preview of it.

## The two people

**The developer** connects the pipeline once. Their win is walking away. After
that connection, Studio must never ask them for a file, a path, or a project
again.

**Domain teams** (support owns how support sounds, marketing owns feature tours)
arrive later, never touch the pipeline, and will not be taught its vocabulary.
They own an outcome, not a configuration.

## What Studio must never show

Files, paths, screenplays, style documents, segments, JSON, rule identifiers,
version numbers, or anything that reveals what the engine is doing underneath.

If a person has to know that a walkthrough is a screenplay plus a style
document, the product has failed. They know that walkthroughs go out, that some
of them are not right, and that they can do something about it.

A decision is a sentence. "We don't say seamless." Not `tone.ai-word`.

## The surfaces

1. **What went out.** The home. Real walkthroughs the pipeline made, most recent
   first, watchable in place, filtered by the outcome a team owns. This is the
   raw material, and it arrives on its own.
2. **A moment.** Stopped inside one walkthrough, at the bit that is wrong.
   Moving through a walkthrough to find it is a finding tool, not an editor.
   Holds and cuts are visible here as gaps, so tempo can be judged.
3. **Reach.** What a proposed change would have done to what already went out,
   with real examples to watch, and the decision to let it hold.
4. **How we sound.** The accumulated decisions, read back as plain sentences.
   This is an output of the loop rather than a form. It is also directly
   editable, because sometimes you know what you want without waiting to be
   annoyed by it, and a newcomer should be able to read it to learn the voice.
5. **What we've decided.** The standing record: what is being enforced, what has
   been let go, and what keeps coming up. What keeps coming up is a signal about
   how the team writes, not just about the pipeline.
6. **Connect the pipeline.** Once, by the developer, then never again.

Ownership, permissions and empty states run through all of it.

## Voice

Nolan's own writing rules apply to Studio's interface, since the product enforces
them on walkthroughs and would look silly breaking them: no em dashes,
contractions, active voice, no hedging, one idea per line, none of the AI
vocabulary (delve, leverage, unlock, robust, seamless), no forced triads.

A confident colleague showing you something they built.

## Success

Someone in a support team watches a walkthrough that went out this morning,
says the opening is too pushy, sees that the same thing has been happening 40
times a week, and fixes all of it before lunch. They never learn what a
screenplay is. The developer does not hear about it.

## Out of scope

Billing and licence administration, the pipeline integration itself, analytics
for their own sake, and anything that films a customer's product in Studio.

## Open, and worth a designer's opinion

1. How much of a walkthrough do you watch before you can react? Autoplay, or a
   still with the line under it?
2. Reach needs a number and evidence. Which lands first, and how many examples
   are enough to trust it?
3. When two teams' decisions collide, whose holds? Company voice presumably wins,
   but the person hitting the wall needs to understand why without a lecture.

## What this replaces

The first model treated Studio as an authoring tool: define a kit, test it
against demo projects you picked, publish it. Three things were wrong with it.
It made Studio a source of record it can never be, since the pipeline outruns it.
It asked people to assemble the material to reason over, which is the exact thing
nobody knows how to do. And its screens were shaped like the repo, down to lint
rule identifiers and version strings in the chrome.

Kits still exist underneath as the unit a team owns and licences. They are not
what the interface is about.
