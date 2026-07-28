# Studio design system

A light working sheet, and a first pass at the loop.

## Reviewing it

```bash
npm run designs
```

That serves this directory and opens `index.html`, a small review page: the list
on the left, a live preview at desktop, tablet or phone width, and a contact
sheet showing every screen at once. Previews are live iframes rather than
screenshots, so they can never drift from the files.

It needs the server because browsers refuse to load `file://` iframes. Nothing
is installed to run it: `serve.mjs` is about forty lines of `node:http`, in
keeping with the rest of the repo. `j` and `k` move between screens, `1` `2` `3`
set the width, `0` shows them all, and the address bar tracks where you are, so
a link can point at one screen (`#a-moment`, or `#all`).

| | |
|---|---|
| `foundations/color.html` | The sheet, and the one dark mark on it. |
| `foundations/type.html` | One face, two jobs, and the timecode gutter. |
| `screens/what-went-out.html` | The home. The stream, read as a transcript. |
| `screens/a-moment.html` | Stopped on the bit that is wrong. Pauses break the rule. |
| `screens/say-whats-wrong.html` | Plain words in, a sentence back. |
| `screens/reach-a-audit.html` | Reach, direction A. Trust through volume. |
| `screens/reach-b-watch.html` | Reach, direction B. Trust through depth. |
| `assets/*.jpg` | Real frames from `support-answer` and `shipped-change`. |

Only the foundations and [`brief.md`](../studio-design-brief.md) are synced to the
**Nolan Studio** project on claude.ai/design. The screens stay here on purpose, so
a fresh pass over there has nothing of ours to copy.

## The direction

**A transcript, not a console.** Studio is read in for an hour at a time, and
everything in it was said at a time, so the page is a working sheet with a
monospace timecode gutter as its spine and hairline rules instead of cards.

**One dark mass per screen: nolan's caption bar.** The walkthrough frames are
light, so dark chrome turns every frame into a hole punched in the page. Keeping
the page light leaves the caption bar as the strongest mark on it, which is
correct, because it is the only part of the page that is really the product.

The first attempt was a dark console with pill tabs, rounded cards, coloured dot
legends and a big number in a right rail. It was unpleasant to read and it looked
like every other machine-made interface. That is worth remembering rather than
quietly fixing: the palette was only half of the tell, and the furniture was the
other half.

## What the screens argue

**The stream is read, not watched.** Each walkthrough shows the lines it said, so
you scan what your product told people this morning. Nothing is flagged for you.
The floor already caught every mechanical fault, so anything still wrong is a
judgment call, and judgment is why a person is here.

**Reach is the product, so it gets two directions.** A audits every changed line,
old struck through, grouped, including the six it spoils. B refuses the list and
makes you watch three properly, with the count as a footnote. Both show what the
change makes worse, because a reach view that only shows wins is a sales pitch.

**Nothing holds until the reach has been seen.** That single gate replaces
define, test, publish.

## The first model

Kits index, kit editor, gate view and four components, deleted in `9e3726e`.
They treated Studio as an authoring tool over files it curated. Recoverable from
`46ab2eb`.
