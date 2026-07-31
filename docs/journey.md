# The customer journey

**Status:** first pass, 2026-07-29. Built on the model in
[`studio-design-brief.md`](./studio-design-brief.md). Vocabulary follows
[`lexicon.md`](./lexicon.md).

Five actors, and only three of them are people. The whole product argument sits
in how differently often each one acts.

## Who, where, when

| Who | Where they are | When they act | How often |
| --- | --- | --- | --- |
| **The developer** | Their own repo and CI | Day 0, once | Once, then never |
| **The pipeline AI** | The customer's runtime | Every event | Hundreds a week |
| **The domain owner** | Studio, in a browser | When something looks off | Minutes a week |
| **The house steward** | Studio | At setup, then when the company changes how it sounds | A few times a year |
| **The end customer** | A help centre, a support reply, a release note | The moment they had the question | Once, per question |

The developer connects it. The AI runs it. The domain owner corrects it. The
house steward arbitrates it. The end customer is the only one who sees the point
of it, and they never learn any of this happened.

## The journey in time

### Before: the developer is the bottleneck

Every team who wants their walkthroughs to sound a particular way asks the
developer. The developer triages, implements, and maintains it. Each new level of
specificity is another thing they hand-build. Support wants warmer. Marketing
wants punchier. Someone wants Japanese.

This is the state Studio is sold against, and it is worth writing down because it
is the only part of the journey the buyer already recognises.

### Day 0: the developer connects the pipeline

**Who:** the developer, alone. **Where:** their repo. **How long:** about an hour.

They install nolan, point it at their app, and add one step to the pipeline that
loads the kit their team owns. They confirm one walkthrough films correctly.

Their win is walking away. From this point Studio never asks them for a file, a
path, or a project again. If it does, the product has failed for them
specifically, and they are the one person who can switch it off.

### From then on, continuously: the loop with nobody in it

**Who:** the pipeline AI. **Where:** the customer's runtime. **When:** every
event, forever.

Something happens. A customer asks a question. A feature ships. The AI loads the
steer, writes a screenplay, and hits the gate. If the gate blocks it, the AI
rewrites and tries again, with no person waiting. Core verifies the targets still
resolve, films it, and it goes out with a real customer's name on it.

Nobody approves anything. That is the point, and it is also the constraint that
kills every design where a person is in the path.

### Week 1: the domain owner arrives

**Who:** the domain owner, for example whoever runs support. **Where:** Studio,
in a browser. **How long:** minutes.

They never touch the pipeline and they will not be taught its vocabulary. They
open Studio and see what went out. Not samples. The real ones, most recent first.

They watch one and something is off. The opening is too pushy. They say so, in
the words they would use to a colleague, from the moment where it happens.

Studio replays that change over what already went out and tells them the truth:
this would have changed 43 of the last 200. Here are six. They watch two, and now
they know what they were actually asking for. They let it hold.

Total elapsed time, minutes. They learned nothing about screenplays.

### Every week after: the record accumulates

The decisions read back as plain sentences, so a newcomer can learn the voice by
reading them. The standing record shows what is enforced, what got let go, and
what keeps coming up.

What keeps coming up is the interesting one. It says something about how the team
writes, not only about the pipeline.

Drift gets caught here too, because a fast writer with no memory returns to its
own habits within a week. Holding is not a one-time act.

### Occasionally: the house steward changes something, or arbitrates

**Who:** whoever owns how the company sounds. **When:** at setup, then rarely.

They set the house voice and the cast once. Later, the company changes how it
talks and they change it in one place.

They also arbitrate. When a team's decision contradicts the house, the house
holds, and the person who hit that wall needs to understand why without a
lecture. Licensing sits with them too, since kits are the unit a team licences.

### Never: pulling something back

Studio is not in the path, so a walkthrough that went out this morning stays out.
Reach fixes the future and measures the past. It does not recall anything.

Write that down as a decision rather than letting someone discover it.

## The asymmetry that defines the product

Say the pipeline makes 200 support walkthroughs a week and the domain owner acts
three times. That is roughly 70 to 1.

The human is outnumbered on purpose. Every design that tries to close that gap
fails, because closing it means putting a person in the path and the pipeline
outruns them by Tuesday.

Reach is the only honest answer. It measures impact backwards over what the
pipeline already did, so nobody has to assemble a test set and nothing goes
stale.

## What the journey exposes that nothing owns yet

Four gaps, found by walking the journey rather than by reading the surfaces.

**1. Week one has no material, and that is when they decide.** Reach needs
history. A team on day 3 has nothing to reach over, so the single most persuasive
thing in the product is missing exactly when the buyer is deciding. The brief
lists "a team that has just connected" as an empty state. The journey says it is
not an empty state, it is a chicken and egg problem, and it needs a real answer.

**2. Blocked forever is invisible.** If a kit is impossible to satisfy, the AI
rewrites and rewrites. Something ships late or never ships. No actor in this
journey is watching the block rate, and no surface reports it. The developer
walked away, and the domain owner only sees what went out, which by definition
excludes what did not.

**3. Nobody sees whether it worked.** Both documents stop at "it goes out".
Whether the end customer actually got unstuck is the real outcome, and no actor
in the journey ever learns it. Studio currently optimises for what a team thinks
sounds right, which is a proxy.

**4. The end customer appears nowhere.** They are the only actor whose experience
is the product, and neither the brief nor the plan models them. At minimum they
should be in the room when we argue about tone.

## Open

1. Does the domain owner arrive because they went looking, or because Studio told
   them? The brief leaves this open and it changes the whole home screen.
2. Who notices the walkthrough that went out wrong to a named customer, and what
   are they allowed to do about it?
3. Is the block rate a Studio surface, or a developer alert? It is the one thing
   in the journey that belongs to the person who already walked away.
