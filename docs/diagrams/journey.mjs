#!/usr/bin/env node
/**
 * Build the customer journey diagram.
 *
 * Rows are actors, columns are time. The layout carries the argument: the
 * pipeline's band runs the full width because it never stops, and everyone
 * else's work is a few small boxes. See docs/journey.md.
 *
 *   npm run diagram        → docs/diagrams/journey.excalidraw
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { scene } from "./lib.mjs";

const { text, box, arrow, elements, toJSON } = scene({ seed: 76543 });

const DEV = { fill: "#d0ebff", stroke: "#1971c2" };
const PIPE = { fill: "#fff3bf", stroke: "#e67700" };
const OWNER = { fill: "#e5dbff", stroke: "#5f3dc4" };
const HOUSE = { fill: "#f3f0ff", stroke: "#5f3dc4" };
const CUST = { fill: "#ffdeeb", stroke: "#c2255c" };
const QUIET = "#868e96";
const GAP = "#e03131";

/* ------------------------------------------------------------------- title */

text("the customer journey", 60, -84, { size: 32 });
text("Five actors. Only three are people. How differently often they act is the whole argument.", 60, -40, {
  size: 16,
  color: QUIET,
});

/* ---------------------------------------------------------- time, across the top */

const COLS = [
  ["DAY 0", 360],
  ["EVERY EVENT, FOREVER", 700],
  ["WEEK 1", 1490],
  ["EVERY WEEK AFTER", 1820],
  ["OCCASIONALLY", 2150],
];
for (const [label, x] of COLS) text(label, x, 72, { size: 14, color: QUIET });

// Column separators, so the empty cells read as deliberate rather than unfinished.
for (const x of [675, 1465, 1795, 2125]) {
  arrow([[x, 60], [x, 830]], { stroke: "#dee2e6", weight: 1, dash: "dashed", head: null });
}
arrow([[60, 110], [2450, 110]], { stroke: "#dee2e6", weight: 1, head: null });

/* ------------------------------------------------- who, down the left gutter */

const ROWS = [
  ["THE DEVELOPER", "their repo and CI", "once, then never", 140],
  ["THE PIPELINE AI", "the customer's runtime", "hundreds a week", 280],
  ["THE DOMAIN OWNER", "Studio, in a browser", "minutes a week", 420],
  ["THE HOUSE STEWARD", "Studio", "a few times a year", 560],
  ["THE END CUSTOMER", "a help centre, a reply", "once, per question", 700],
];
for (const [who, where, often, y] of ROWS) {
  text(who, 70, y + 12, { size: 17 });
  text(where, 70, y + 38, { size: 13, color: QUIET });
  text(often, 70, y + 58, { size: 13, color: "#1e1e1e" });
}

/* ----------------------------------------------------- the developer: once */

box("connect", 360, 150, 280, 90, "Connects the pipeline\nabout an hour", { ...DEV, size: 14 });

// The walk-away is the win, and it is also why nobody is left watching.
arrow([[660, 195], [2440, 195]], { stroke: "#1971c2", weight: 2, dash: "dashed", head: null });
text("Never asked for a file, a path or a project again.", 710, 166, { size: 13, color: "#1971c2" });
text("Gap: if the gate blocks a kit forever, nobody here finds out.", 710, 205, { size: 13, color: GAP });

/* ------------------------------------- the pipeline: the band that never stops */

box(
  "loop",
  700,
  290,
  1740,
  90,
  "Loads the steer · writes it · hits the gate · films it · it goes out\nHundreds a week, and nobody approves anything.",
  PIPE,
);

text(
  "About 70 pipeline actions for every 1 human action. That ratio is why nobody can sit in the path.",
  700,
  394,
  { size: 13, color: "#e67700" },
);

/* ------------------------------------------------ the domain owner: minutes */

box("notice", 1490, 430, 280, 90, "Notices. Says what's wrong.\nSees reach. Lets it hold.", { ...OWNER, size: 14 });
box("record", 1820, 430, 280, 90, "Reads the record.\nCatches the drift back.", { ...OWNER, size: 14 });

text("Gap: week 1 has no history,\nso reach has nothing to show yet.\nThis is when they decide.", 720, 440, {
  size: 13,
  color: GAP,
});

/* ------------------------------------------------- the house steward: rarely */

box("house", 360, 570, 280, 90, "Sets the house voice\nand the cast", { ...HOUSE, size: 14 });
box("arbitrate", 2150, 570, 290, 90, "Changes how the company\nsounds. Arbitrates.", { ...HOUSE, size: 14 });

/* -------------------------------------------- the end customer: the actual point */

box("watch", 700, 710, 750, 90, "Watches a walkthrough and gets unstuck.\nNever learns that any of this happened.", CUST);

text("Gap: nobody ever learns whether it worked.", 1500, 745, { size: 13, color: GAP });

/* ------------------------------------------------------------------ legend */

text("Red marks something this journey exposes that nothing owns yet.", 60, 860, { size: 13, color: GAP });
text("Studio can never pull back a walkthrough that already went out. It fixes the next one.", 60, 884, {
  size: 13,
  color: QUIET,
});

/* ------------------------------------------------------------------- write */

const dest = fileURLToPath(new URL("./journey.excalidraw", import.meta.url));
await writeFile(dest, JSON.stringify(toJSON(), null, 2) + "\n");
console.log(`· ${elements.length} elements → ${dest}`);
