# Studio design prompt

For claude.ai/design, with the **Nolan Studio** design-system project attached.
Paste it whole, or work through `DESIGN THESE` one block at a time if the output
thins out. The context above that heading is short enough to repeat each time.

Kept here rather than in a chat window because it will keep changing. The
reasoning behind it is [`studio-design-brief.md`](./studio-design-brief.md).

---

```
Design Nolan Studio, end to end.

WHAT IT IS
Studio is a control plane where non-developers shape how their company's
automated product walkthroughs sound and look. The open-source nolan engine turns
a screenplay into a filmed walkthrough of a real web app. Studio is the paid layer
on top: a team-licensed place to define, test and publish "kits".

A kit is brand, presenters, locales, per-use-case instructions, and a craft floor.

Studio is never in the production path. The customer's own pipeline AI writes and
films the walkthroughs people actually receive, at runtime, inside their product.
Studio makes the instructions those films are made from. Studio does film, but
only ever demo projects, and only to answer "what did that change do".

THE MECHANIC TO KEEP VISIBLE
The pipeline AI is a free writer. Getting a guarantee out of it takes two
touchpoints: the kit steers the draft going in, and the craft floor gates it
coming out. Freedom plus guarantee. A design that shows only the steering half
misses why anyone would trust this.

TESTING RUNS AT TWO SPEEDS, AND THE DIFFERENCE IS A DESIGN PROBLEM
Preview is instant and runs on paint logic ported from the engine, so wording,
presenter, captions and reading time update as you type.
Filming a test runs the real engine over demo projects. It takes seconds to
minutes and it is queued.
A preview cannot show a cut, a hold, or how a walkthrough feels in motion, and
tempo and transitions are half of the craft. So publishing waits on a filmed
test, and a preview that has drifted from the last test needs to say so.

TWO USERS, ARRIVING MONTHS APART
The developer wires nolan into the pipeline once. Their win is walking away.
Today every team's stylistic request routes through them.
Domain teams (support owns the support kit, marketing owns feature tours) arrive
after the wiring, never touch the pipeline, and will not be taught JSON.

VOCABULARY
kit, brief, the floor, walkthrough, demo project, pipeline, preview, filmed test,
published, draft. Not: template, config, settings, campaign, asset, render.

USE THE DESIGN SYSTEM
Take colour, type, spacing and voice from the Nolan Studio design system. Its
rule: chrome is graphite and paper throughout, and colour appears only where a
real walkthrough does, so an indigo presenter chip means you are looking at
nolan's output rather than at Studio's furniture.

Three screens already exist: Kits, Kit editor, The floor. Extend them, don't
redo them.

DESIGN THESE

Getting started, for the developer
1. Wire nolan into a pipeline. Connect, confirm it is running, see the first
   walkthrough come through.
2. Pick demo projects: the real walkthroughs every kit gets tested against.
3. Hand off. Invite teams, give each one the kits they own, and leave.

Shaping, for the domain team
4. Start a kit. It begins as company voice with nothing changed, so the first
   screen is about what to change first.
5. A kit in a second locale. Localisation goes deeper than a language dropdown:
   its own presenters, formats and pacing. Show a Japanese variant of a kit whose
   parent is in English.
6. Test against demo projects. Several real walkthroughs, before and after, in
   one view, with a decision at the end of it. This is the missing middle of
   define, test, publish.
7. Film a test: asking for one, waiting on one, and the state where the kit has
   changed since the last one so what you are looking at is stale.
8. The timeline. This is a way into the brief, not a film editor. Scrub a filmed
   test, stop on a moment, and see which kit phrase and which floor rule produced
   what is on screen. Editing there edits the kit, so show how many other moments
   across the demo projects the same change moves. Holds and cuts are visible as
   gaps, which makes this the one place tempo can be judged.
9. Edit the floor for one kit. Which craft rules apply, and tightening or
   loosening one, knowing the company floor sits underneath.
10. Version history. What changed, who changed it, and going back.

The edges
11. An org with no kits yet.
12. A team member who can edit but not publish, asking for review.
13. The kit editor at tablet and phone width.

CONSTRAINTS
Avoid settings forms. The kit editor reads as prose you edit phrase by phrase,
and everything should feel like the same product. No vanity metric tiles, no
gradient chrome, no dashboard furniture competing with the walkthroughs on screen.

Interface copy follows nolan's own craft rules, because the floor enforces them
on walkthroughs and the product would look silly breaking them: no em dashes,
contractions, active voice, no hedging, one idea per line, and none of the AI
vocabulary (delve, leverage, unlock, robust, seamless). An action keeps its name
through the whole flow, so what says Publish produces a kit that says Published.

Empty states are an invitation to act. Errors say what happened and how to fix it.

DELIVERABLE
Work through the three blocks in order. Show two directions each for screens 6
and 8, since nobody has designed either yet. Responsive down to phone, visible
keyboard focus, motion only where it explains something.
```
