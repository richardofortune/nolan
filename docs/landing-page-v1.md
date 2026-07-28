# Nolan landing page, v1 content spec

## Purpose

Help a technical visitor understand, in one pass, that Nolan turns a change in a
real web product into a clear walkthrough people can follow. The page should
make the craft and control of the output feel tangible, then connect that
control to customer support and AI-speed product delivery.

## Positioning

**One-line promise**

Nolan gives agents the craft to explain what they built.

**Expanded promise**

Your agents build fast. Nolan turns product changes into clear, branded
walkthroughs, filmed against the real app and ready for the people affected by
the change.

**Category**

Screenplay-driven product walkthroughs for web apps.

**What makes the claim believable**

- A screenplay describes the path through the real product.
- A separate style file controls how every walkthrough looks and reads.
- Nolan films a real browser and produces GIF, MP4, and subtitle files.
- `nolan verify` catches a walkthrough whose targets no longer match the app.

## Audience and first action

**Primary visitor:** a developer or product engineer building a web product with
AI assistance.

**First action:** run the bundled example.

**Primary CTA:** `Run the example`

**Secondary CTA:** `Watch Nolan explain itself`

GitHub and documentation remain visible in the navigation. Do not use an email
capture, pricing, a sales CTA, or invented customer metrics in v1.

## Page structure and draft copy

### 1. Navigation

```
nolan                         How it works   Examples   Docs   GitHub
```

Keep the header quiet. The GitHub link is the action for visitors who prefer to
inspect before they install.

### 2. Hero

**Eyebrow:** `Screenplay-driven walkthroughs for web apps`

**Headline:**

```
Your agents build fast.
Nolan helps people keep up.
```

**Supporting copy:**

```
Turn a real product change into a clear, branded walkthrough. Nolan films your
app from a screenplay, so each explanation is made for the moment it is needed.
```

**Actions:** `Run the example` and `Watch the walkthrough`

**Hero media:** autoplaying, muted `examples/out/showcase-full.gif` or a small
MP4 replacement. Captions must remain readable at typical laptop width. Include
a visible play control and a static poster or first-frame fallback.

**Caption under media:** `This walkthrough was made by Nolan.`

### 3. The control bar

**Section label:** `Make it worth watching`

**Heading:** `The explanation is part of the product.`

**Copy:**

```
An agent can describe a change in seconds. Making that description feel clear,
considered, and recognisably yours takes direction. Nolan keeps that direction
in the work: the words, pace, captions, presenter, transitions, and output.
```

Use a three-part diagram rather than feature cards:

```
screenplay                 style                     output
what happens               how it feels              what people receive
per change or person       shared across work         GIF · MP4 · SRT · VTT
```

Small supporting line:

```
Change the style once. Every walkthrough inherits it.
```

### 4. Product truth

**Section label:** `Film the real thing`

**Heading:** `A walkthrough should not outlive the product it explains.`

**Copy:**

```
Nolan drives a real browser through your app. The same screenplay can be
checked in CI, so a moved button or changed flow is caught before an old demo
starts telling the wrong story.
```

Show real, compact terminal output next to the copy:

```text
$ nolan verify demo.screenplay.json

✗ 2 target(s) no longer resolve:
  [walkthrough] click: no visible button named "Calculate split"
```

**Callout:** `Your demo changed because the product changed. Fix it while the change is still in front of you.`

### 5. Three moments Nolan serves

Use three editorial panels. These are outcomes, not feature categories.

#### Answer a real customer

```
Someone asks how the new flow works. Give them a walkthrough of their path,
with the right words and the real interface in front of them.
```

Suggested visual: a support question paired with a short, customer-specific
screenplay excerpt and its rendered result.

#### Ship a change people can follow

```
An agent ships a feature. Nolan gives the feature a human explanation before it
becomes another line in a changelog.
```

Suggested visual: `feature branch → screenplay → walkthrough → release note`.

#### Keep the story true

```
Your product keeps moving. Re-run the screenplay, refresh the output, and check
that the path still resolves.
```

Suggested visual: a UI diff or changed target followed by successful `verify`
output.

### 6. The smallest possible example

**Heading:** `A screenplay is the direction, not a script.`

Show a shortened, valid snippet from `examples/splitter.screenplay.json`. Limit
it to `goto`, `say`, `click`, and `hold`. Put its output beside it. Link to the
full screenplay and schema documentation.

Supporting copy:

```
The agent writes what to show. Your style file decides how it is delivered.
```

### 7. Start

**Heading:** `Film one change.`

```bash
git clone https://github.com/richardofortune/nolan
cd nolan
npm install playwright && npx playwright install chromium
npm start
```

Below the command, state only the actual requirements: Node 18+, `ffmpeg`, and
Playwright Chromium. Link to the README for alternatives and troubleshooting.

## Visual direction

- Treat output media as the visual identity. Do not surround it with generic
  gradient illustration or dashboard chrome.
- Use a dark, editorial base with a warm paper or pale-grey reading surface for
  code and explanatory material. The product output should carry the colour.
- Use a monospace face for commands and screenplay fragments; use a calm sans
  serif for the page.
- Show individual moments in a generous frame. Avoid a dense grid of features.
- Motion should demonstrate Nolan. It should not decorate the page.

## Language guardrails

Use: `walkthrough`, `real app`, `screenplay`, `direction`, `change`, `clear`,
`in your voice`, `people`.

Avoid: `AI-powered demos`, `personalisation at scale`, `enablement`, `pipeline`,
`seamless`, `unlock`, `next-generation`, `revolutionary`, and unsubstantiated
conversion or time-saving claims.

Do not present Nolan as a generic screen recorder, interactive demo platform,
or generic video framework. The distinction is the directed, maintained
walkthrough of a real product.

## Assets required before implementation

1. A web-optimised hero MP4 and poster from the existing showcase render.
2. A 6 to 10 second support-response example, built with a real screenplay.
3. A small shipping-change example, also built with a real screenplay.
4. A short selector-drift terminal capture or rendered terminal asset.
5. A Nolan wordmark or deliberately simple typographic lockup.

## Acceptance criteria

- A first-time visitor can describe Nolan without opening the docs.
- The page makes the output-quality bar visible before making broad claims.
- The three outcome panels clearly connect back to that control.
- The installation path is copyable and accurately reflects the README.
- All product claims are demonstrated by tracked Nolan artifacts.
