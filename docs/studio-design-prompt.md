# Studio design prompt

For claude.ai/design. Paste it whole, or work through `DESIGN THESE` one block at
a time if the output thins out. The context above that heading is short enough to
repeat each time.

The reasoning behind it is [`studio-design-brief.md`](./studio-design-brief.md),
which is also pushed into the design project so it sits alongside the components.

**On the design system:** it holds foundations only, on purpose. Colour, type,
two real walkthrough stills, and the brief. Everything shaped by the earlier
authoring-shaped model has been deleted rather than reworked, so there are no
screens to copy and no old vocabulary to inherit. Design the screens fresh.

The foundations are a light working sheet, not a dark console. Studio is read in
for an hour at a time, and the walkthrough frames are themselves light, so a dark
chrome makes every frame a hole punched in the page. The one dark mass allowed on
a screen is nolan's own caption bar, which is a real part of the film.

---

```
Design Nolan Studio, end to end.

WHAT IT IS FOR
The open-source nolan engine turns a spec into a filmed walkthrough of a real web
app. A company wires it into their pipeline, and from then on their own AI writes
and films walkthroughs continuously, in response to real events. A customer asks
a question. A feature ships. Something needs explaining.

Studio is the paid layer whose job is to make that stream better over time. It
earns its place by uplift, not by ownership.

THE ONE STRUCTURAL FACT
Studio is not the source and can never be. The pipeline produces more in a day
than anyone can curate in a month, so anything Studio holds as a sample is stale
before it is looked at. Any screen that asks a person to assemble the material
they want to reason over has already failed, because nobody knows what to
assemble. Studio never asks for input material. It watches what the pipeline is
already making.

THE LOOP, WHICH IS THE PRODUCT
Notice a moment in a walkthrough that actually went out. Say what is wrong with
it in the words you would use to a colleague: "too pushy", "we don't say
seamless", "that pause is too long". Nobody types a threshold or picks a rule
from a list.

Then Studio shows the reach: it replays that change over what has already gone
out and reports the truth. "This would have changed 43 of the last 200 support
walkthroughs. Here are six." You watch two, and you know what you are really
asking for. Then it holds, and keeps holding, because a fast writer with no
memory drifts back within a week.

Reach is the thing to design hardest. Everything else in this space is a settings
screen that promises an outcome. Reach shows the outcome, against real history,
before anyone commits.

TWO PEOPLE
The developer connects the pipeline once, and their win is walking away. After
that, Studio never asks them for a file, a path or a project again.
Domain teams (support owns how support sounds, marketing owns feature tours)
arrive later, never touch the pipeline, and own an outcome rather than a
configuration.

WHAT STUDIO MUST NEVER SHOW
Files, paths, screenplays, style documents, JSON, rule identifiers, version
numbers, or anything revealing how the engine works underneath. If someone has to
learn that a walkthrough is a spec plus a style document, the product has failed.
A decision is a sentence. "We don't say seamless." Never a rule id.

DESIGN THESE

The loop
1. What went out. The home. Real walkthroughs the pipeline made, most recent
   first, watchable in place, filtered by the outcome a team owns. Design for
   someone scanning for something that feels off, not searching for a known item.
2. A moment. Stopped inside one walkthrough at the bit that is wrong. Getting
   there is a finding tool, not an editor. Holds and cuts should be visible as
   gaps, since tempo cannot be judged from a still.
3. Saying what is wrong, in plain words, from that moment. Show how Studio
   confirms it understood without making the person fill in a form.
4. Reach. What this would have changed across what already went out: the number,
   the evidence, and enough real examples to trust it. Then the decision to let
   it hold. This is the most important screen in the product, so show two
   directions.

Living with it
5. How we sound. The accumulated decisions read back as plain sentences, editable
   directly, and readable by a newcomer learning the voice.
6. What we've decided. The standing record: what is enforced, what has been let
   go, and what keeps coming up. What keeps coming up says something about how
   the team writes, not only about the pipeline.
7. A decision that collides with the company's. Whose holds, and how the person
   hitting it understands why without a lecture.

The edges
8. Connect the pipeline. Once, by the developer, then never again.
9. A team that has just connected and has nothing yet, next to a team six months
   in.
10. Someone who can suggest but not decide.
11. The moment view at tablet and phone width, since noticing happens anywhere.

CONSTRAINTS
No settings forms, no rule tables, no vanity metric tiles, no gradient chrome, no
dashboard furniture competing with the walkthroughs on screen. The walkthroughs
are the interface's content and should be the loudest thing in it.

Interface copy follows nolan's own craft rules, because the product enforces them
on walkthroughs and would look silly breaking them: no em dashes, contractions,
active voice, no hedging, one idea per line, and none of the AI vocabulary
(delve, leverage, unlock, robust, seamless). An action keeps its name through the
whole flow.

Empty states are an invitation to act. Errors say what happened and how to fix it.

DELIVERABLE
Work through the three blocks in order. Two directions for screen 4. Responsive
down to phone, visible keyboard focus, motion only where it explains something.
```
