# Studio design system

Foundations only, deliberately.

| | |
|---|---|
| `foundations/color.html` | The colour rule. Chrome is graphite and paper, and colour appears only where a real walkthrough does. |
| `foundations/type.html` | Sans for anything a person wrote, mono for anything a machine owns. |
| `assets/walkthrough-frame.jpg` | A real frame from `examples/support-answer.screenplay.json`, so nobody designs against a grey box. |

Synced to the **Nolan Studio** project on claude.ai/design, which also holds
[`../studio-design-brief.md`](../studio-design-brief.md) as `brief.md`.

## Why there are no screens here

There were: Kits, a kit editor, and a gate view, plus four components. They
modelled Studio as an authoring tool where you define a kit, test it against demo
projects you picked, and publish. That model is wrong. The pipeline outruns
anything Studio curates, and the screens had started reflecting this repo rather
than the experience, down to lint rule ids and version strings sitting in the
chrome.

They were deleted rather than reworked, so a fresh pass has nothing old to copy.
They are in git if you want to look: commit `46ab2eb`.

The one idea worth carrying forward is recorded in the brief instead of in a
component, which is where an idea belongs until it has earned a screen: the
accumulated decisions read back as plain sentences, edited phrase by phrase,
rather than a form over a config file.
