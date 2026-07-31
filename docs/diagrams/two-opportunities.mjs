#!/usr/bin/env node
/**
 * Two opportunities, one line between them.
 *
 * The point of this diagram is the separation, so it is built to resist being
 * read as a single system. There is no cycle. Exactly one arrow crosses the
 * line, it points down, and nothing points back up.
 *
 * Below the line is complete on its own. Someone grabs nolan, makes something,
 * and sends it. Above the line is where the intent gets refined, so the same
 * argument does not get had again on the next project.
 *
 *   npm run diagram    → docs/diagrams/two-opportunities.excalidraw
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { scene } from "./lib.mjs";

const { text, box, arrow, elements, toJSON } = scene({ seed: 11235 });

const STUDIO = { fill: "#e5dbff", stroke: "#5f3dc4" };
const CORE = { fill: "#d3f9d8", stroke: "#2f9e44" };
const VIOLET = "#5f3dc4";
const GREEN = "#2f9e44";
const QUIET = "#868e96";

/* ------------------------------------------------------------------- title */

text("two opportunities, one line between them", 60, -84, { size: 32 });
text("Core is complete on its own. Studio refines what Core does. That is the only connection.", 60, -40, {
  size: 16,
  color: QUIET,
});

/* ------------------------------------------------------ above: nolan studio */

box("zone-studio", 60, 50, 1580, 350, null, { stroke: "#d0c8f0", weight: 1, dash: "dashed" });

text("ABOVE THE LINE  ·  LATER", 90, 70, { size: 13, color: QUIET });
text("NOLAN STUDIO", 90, 92, { size: 26, color: VIOLET });
text("Where the communication intent gets refined.", 90, 132, { size: 17 });

box("argue", 90, 180, 520, 130, "You keep re-arguing how the output\nshould look, sound and move.\nEvery project. Every time.", {
  ...STUDIO,
  size: 15,
});

text("WHAT IT SETTLES", 660, 180, { size: 13, color: QUIET });
box("look", 660, 205, 180, 70, "look and feel", STUDIO);
box("pacing", 870, 205, 180, 70, "pacing", STUDIO);
box("trans", 1080, 205, 180, 70, "transitions", STUDIO);
box("hold", 1290, 205, 180, 70, "the hold", STUDIO);

text("Decided once, so nobody argues it again.", 660, 300, { size: 17, color: VIOLET });
text("Refining is the product.", 660, 330, { size: 14, color: QUIET });
text("Built from what people find painful in Core.\nNot designed ahead of that.", 90, 330, { size: 14, color: QUIET });

/* -------------------------------------------------------------- the line */

arrow([[60, 460], [1640, 460]], { stroke: "#1e1e1e", weight: 4, head: null });
text("Everything below this line works with nothing above it.", 90, 474, { size: 15 });
text("Core ships first, on its own, and never mentions Studio.", 90, 498, { size: 15, color: QUIET });

// The one connection. It points down, and there is deliberately no return.
arrow([[1600, 360], [1600, 620]], { stroke: VIOLET, weight: 2, dash: "dashed" });
text("later: refines what Core does", 1300, 474, { size: 14, color: VIOLET });

/* -------------------------------------------------------- below: nolan core */

box("zone-core", 60, 520, 1580, 560, null, { stroke: "#bfe6c6", weight: 1, dash: "dashed" });

text("BELOW THE LINE  ·  SHIPS FIRST", 90, 540, { size: 13, color: QUIET });
text("NOLAN CORE", 90, 562, { size: 26, color: GREEN });
text("Someone grabs nolan and makes something they can send.", 90, 602, { size: 17 });

text("WHO", 90, 650, { size: 13, color: QUIET });
text("anyone with an AI  ·  a builder  ·  a developer  ·  a consultant  ·  you", 90, 672, { size: 16 });

text("WHAT THEY EXPLAIN", 90, 720, { size: 13, color: QUIET });
box("built", 90, 745, 280, 70, "what I built", CORE);
box("changing", 390, 745, 280, 70, "what's changing", CORE);
box("overnight", 690, 745, 280, 70, "what happened overnight", { ...CORE, size: 14 });
box("howto", 990, 745, 280, 70, "how to do this", CORE);
box("why", 1290, 745, 280, 70, "why it works this way", { ...CORE, size: 14 });

box(
  "mum",
  90,
  860,
  760,
  140,
  "My mother asked how to pay her taxes online.\nI told my AI to fetch nolan, look it up,\nand send her a GIF.",
  { ...CORE, size: 16 },
);

text("Not a product.\nNot a company.\nAny web activity.\nNo Studio anywhere in this.", 890, 872, {
  size: 15,
  color: GREEN,
});

text("The output is a GIF one person sends to another.", 90, 1020, { size: 17 });
text("This is the whole product at release.", 90, 1046, { size: 14, color: QUIET });

/* ------------------------------------------------------------------- write */

const dest = fileURLToPath(new URL("./two-opportunities.excalidraw", import.meta.url));
await writeFile(dest, JSON.stringify(toJSON(), null, 2) + "\n");
console.log(`· ${elements.length} elements → ${dest}`);
