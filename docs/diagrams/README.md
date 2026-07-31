# Diagrams

## core-and-studio

How nolan core and Nolan Studio fit together, and where the line between them
sits. It follows the model in [`../studio-design-brief.md`](../studio-design-brief.md):
Studio compiles two things the pipeline loads, then reads what already went out.
It is never in the production path, so it can never be the bottleneck.

Read it as one counterclockwise loop. The pipeline runs left to right along the
middle. Studio runs right to left along the top, starting from what went out and
ending at the kit that steers the next one. Core sits underneath as the only
thing either of them calls.

## journey

Who does what, where, and how often, from
[`../journey.md`](../journey.md). Rows are actors, columns are time.

The layout carries the argument. The pipeline's band runs the full width because
it never stops, and everyone else's work is a few small boxes. Red marks
something the journey exposes that nothing owns yet.

## Working on it

```
npm run diagram          # rebuild every .excalidraw and its .svg preview
npm run diagram:check    # confirm real Excalidraw opens them with nothing dropped
```

| File | What it is |
| --- | --- |
| `lib.mjs` | The scene builder every diagram uses. |
| `build.mjs`, `journey.mjs` | The sources. Layout lives here, so edit these. |
| `*.excalidraw` | Generated. Drag onto excalidraw.com, or open with the Excalidraw VS Code extension. Fully editable after that. |
| `*.svg` | Generated preview, for looking at in a browser or a README. Clean lines rather than Excalidraw's hand-drawn ones, so treat it as a layout check. |
| `check.mjs`, `check.html` | Load each scene into the real Excalidraw and report what its `restore()` did with it. Needs network access, since the page pulls Excalidraw from a CDN. |

Editing an `.excalidraw` by hand works, but the next `npm run diagram` will
overwrite it. Move the change into the generator to keep it.

To add a diagram: write `<name>.mjs` against `lib.mjs`, then add it to the
`diagram` script in `package.json`. `check.mjs` picks it up by name.
