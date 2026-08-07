# Presenter assets

The face in the corner bubble. Two registers, one set of framing rules.

Point a cast member's `cam` at whichever suits the job:

```jsonc
"cast": { "host": { "kind": "human", "name": "Mia", "cam": "./assets/people/woman-1.jpg" } }
```

## Framing — the part that matters

Every style renders the presenter as a **circle** (`presenter.shape`), between
**132px and 144px**. A circular mask crops the corners off a square, so anything
already tight against the edge loses hair, ears and chin.

The first bundled set got this wrong: the faces were cropped edge to edge with no
shoulders and no headroom, so the bubble clipped into them and they read as a face
pressed against the lens rather than someone talking to you.

**Rules for any presenter asset:**

- **Head and shoulders, not a face.** The head should be roughly the middle half
  of the frame's height. Shoulders visible at the bottom edge.
- **Headroom.** Clear space above the hair. Nothing that matters within ~12% of
  any edge, because the circle takes the corners.
- **Facing the lens.** Eyes to camera. Someone giving a demo looks at you.
- **Warm and awake.** A slight smile or an open, attentive expression. Not a
  passport photo, not a grin.
- **Square**, 512×512 or larger. Downscales to the bubble cleanly.
- **Coherent as a set.** Same light direction, same warmth, same crop distance,
  same mood across every face. A cast should look like it belongs to one product.

## Register 1 — photographic (`people/`)

For **support how-tos and personal walkthroughs**, where a human guide is doing
the reassuring. Should read as a still from a video call.

Beyond the framing rules: soft indoor light from one side, a real room falling
out of focus behind, natural skin, ordinary clothes. No studio backdrop, no
stock-photo gloss, no hard shadow.

**Generation prompt** — one per cast member, varying only the person:

> Candid webcam still of a person at their desk, head and shoulders, looking
> directly into the camera with a slight warm smile. Soft natural window light
> from one side. Ordinary home-office room blurred gently behind. Everyday
> clothing. Neutral colour grading, no filter. Square crop with clear space above
> the head and shoulders visible at the bottom edge. Photographic, not stylised.

Keep every other word identical between generations so the set coheres.

**These must not be real people.** See Provenance below.

## Register 2 — illustrated (`face-*.png`)

For **product tours and documentation**, where a photograph sits oddly against
app UI. Should read as an avatar the product itself would ship.

Beyond the framing rules: flat shapes, a small confident palette, a solid or
softly graded ground. Legible at 132px — no fine detail that turns to mush.

**Generation prompt:**

> Flat vector avatar of a person, head and shoulders, facing forward, calm
> friendly expression. Bold simple shapes, limited palette, no outlines or thin
> details. Solid soft-gradient background. Centred square composition with clear
> space above the head. Modern product-UI illustration, not cartoon or clip-art.

## Checking a candidate

Before committing one, look at it as a 140px circle, not at full size. Then:

- [ ] Nothing important inside ~12% of any edge
- [ ] Shoulders visible; head is about the middle half of the frame
- [ ] Eyes meeting the lens
- [ ] Sits beside the others without looking like a different shoot
- [ ] Still legible at 132px

`npm run desk` previews a real face in the real bubble — the fastest way to judge
one, because it shows the ring and the mask rather than the raw square.

## Provenance

The photographic faces are **AI-synthesised people who do not exist**, not
photographs of real individuals. Because no real person is depicted, there's no
likeness or privacy concern in shipping them as demo avatars.

Keep it that way. Stock photography of real people would mean a real person
appearing to present someone else's product, which is a problem these avoid
entirely. For a production video, swap in a real headshot you have the rights to.

| file | | file | |
|---|---|---|---|
| `people/woman-1.jpg` | blonde | `people/man-1.jpg` | dark hair, warm smile |
| `people/woman-2.jpg` | short dark hair | `people/man-2.jpg` | middle-aged |
| `people/woman-3.jpg` | brown hair | `people/man-3.jpg` | stubble, glasses |
| | | `people/man-4.jpg` | older, grey |
| `face-female.png` | illustrated | `face-male.png` | illustrated |
