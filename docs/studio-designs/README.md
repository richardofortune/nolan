# Studio design system

Foundations, and a first pass at the loop on the second model.

| | |
|---|---|
| `foundations/color.html` | The colour rule. Chrome is graphite and paper, and colour appears only where a real walkthrough does. |
| `foundations/type.html` | Sans for anything a person wrote, mono for anything a machine owns. |
| `screens/what-went-out.html` | The home. The stream, scanned as sentences. |
| `screens/a-moment.html` | Stopped on the bit that is wrong. Pauses read as gaps. |
| `screens/say-whats-wrong.html` | Plain words in, a sentence back. |
| `screens/reach-a-audit.html` | Reach, direction A. Trust through volume. |
| `screens/reach-b-watch.html` | Reach, direction B. Trust through depth. |
| `assets/*.jpg` | Real frames from `support-answer` and `shipped-change`, so nobody designs against a grey box. |

Only the foundations and [`brief.md`](../studio-design-brief.md) are synced to the
**Nolan Studio** project on claude.ai/design. The screens stay here on purpose, so
a fresh pass over there has nothing of ours to copy and the two takes can be
compared honestly.

## What the screens argue

**The stream is read, not watched.** Each walkthrough shows the lines it said, so
you scan what your product told people this morning. Nothing is flagged for you.
The floor already caught every mechanical fault, so anything still wrong is a
judgment call, and judgment is the reason a person is here.

**Reach is the product, so it gets two directions.** A audits: every changed line,
old struck through, new underneath, grouped by what it does, including the six it
makes worse. B refuses the list: three walkthroughs to watch properly, with the
count as a footnote, on the argument that skimming 43 diffs tells you less than
watching three. Both show the ones it gets wrong, because a reach view that only
shows wins is a sales pitch.

**Nothing holds until the reach has been seen.** That is the only gate, and it
replaces define, test, publish.

## The first model

Kits index, kit editor, gate view, and four components, deleted in `9e3726e`.
They treated Studio as an authoring tool over files it curated. Recoverable from
`46ab2eb` if the argument ever needs re-reading.
