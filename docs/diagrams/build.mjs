#!/usr/bin/env node
/**
 * Build the core/studio flow diagram.
 *
 * Excalidraw's file format is plain JSON, so the diagram is generated rather
 * than hand-drawn. That keeps it diffable, keeps the layout honest when the
 * model changes, and stays dependency-free like the rest of the repo.
 *
 *   npm run diagram        → docs/diagrams/core-and-studio.excalidraw
 *
 * Open it by dragging onto excalidraw.com, or with the Excalidraw VS Code
 * extension. It stays fully editable after that.
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { scene } from "./lib.mjs";

const { text, box, arrow, elements, toJSON } = scene();

/* ------------------------------------------------------------------ colour */

const STUDIO = { fill: "#e5dbff", stroke: "#5f3dc4" };
const PIPE = { fill: "#fff3bf", stroke: "#e67700" };
const CORE = { fill: "#d3f9d8", stroke: "#2f9e44" };
const QUIET = "#868e96";

/* ------------------------------------------------------------------- title */

text("nolan core and nolan studio", 60, -84, { size: 32 });
text("One loop. Core films it, Studio makes the next one better.", 60, -40, { size: 16, color: QUIET });

/* ------------------------------------------------------------------- bands */

// The left margin under each heading is kept clear, so no arrow ever crosses one.
box("band-studio", 60, 60, 1680, 410, null, { stroke: "#adb5bd", weight: 1, dash: "dashed" });
text("NOLAN STUDIO", 90, 80, { size: 20, color: "#5f3dc4" });
text("The paid layer. A private repo.", 90, 108, { size: 14, color: QUIET });

box("band-pipe", 60, 540, 1680, 300, null, { stroke: "#adb5bd", weight: 1, dash: "dashed" });
text("THE CUSTOMER'S PIPELINE", 90, 558, { size: 20, color: "#e67700" });
text("Runs on their events, in their environment.", 90, 586, { size: 14, color: QUIET });

box("band-core", 60, 880, 1680, 230, null, { stroke: "#adb5bd", weight: 1, dash: "dashed" });
text("NOLAN CORE", 90, 898, { size: 20, color: "#2f9e44" });
text("Open source, MIT. The engine.", 90, 926, { size: 14, color: QUIET });

/* ------------------------------------------- studio: the loop, right to left */

box("notice", 1420, 190, 210, 100, "Notice\na real one that went out", STUDIO);
box("say", 1160, 190, 210, 100, "Say what's wrong\nin your own words", STUDIO);
box("reach", 900, 190, 210, 100, "Reach\nit would have changed\n43 of the last 200", { ...STUDIO, weight: 4, size: 15 });
box("hold", 640, 190, 210, 100, "Hold\nit applies from now on", STUDIO);
box("kit", 380, 190, 210, 100, "The kit\nwhat a team owns", STUDIO);

box("steer", 350, 340, 210, 80, "Steer\nhow to write it", STUDIO);
box("gate", 630, 340, 210, 80, "Gate\nwhat can't ship", STUDIO);

arrow([[1420, 240], [1370, 240]], { from: "notice", to: "say", stroke: "#5f3dc4" });
arrow([[1160, 240], [1110, 240]], { from: "say", to: "reach", stroke: "#5f3dc4" });
arrow([[900, 240], [850, 240]], { from: "reach", to: "hold", stroke: "#5f3dc4" });
arrow([[640, 240], [590, 240]], { from: "hold", to: "kit", stroke: "#5f3dc4" });
arrow([[455, 290], [455, 340]], { from: "kit", to: "steer", stroke: "#5f3dc4" });
arrow([[570, 290], [720, 340]], { from: "kit", to: "gate", stroke: "#5f3dc4" });

text("Reach is the whole product. Everything else in this\nspace promises an outcome. This one shows it first.", 890, 300, { size: 13, color: "#5f3dc4" });

/* ------------------------------------------------------- the pipeline, left to right */

box("event", 150, 650, 200, 100, "Something happens\na question, a release", PIPE);
box("draft", 430, 650, 240, 100, "Their AI writes it\nloading the steer", PIPE);
box("check", 750, 650, 200, 100, "The gate\npasses, or says why not", PIPE);
box("film", 1030, 650, 200, 100, "nolan films it\ndriving the real app", PIPE);
box("out", 1310, 650, 200, 100, "It goes out\nwith a customer's name on it", { ...PIPE, size: 15 });

arrow([[350, 700], [430, 700]], { from: "event", to: "draft", stroke: "#e67700" });
arrow([[670, 700], [750, 700]], { from: "draft", to: "check", stroke: "#e67700" });
arrow([[950, 700], [1030, 700]], { from: "check", to: "film", stroke: "#e67700" });
arrow([[1230, 700], [1310, 700]], { from: "film", to: "out", stroke: "#e67700" });

// Blocked drafts go straight back. Nobody is waiting on a person here.
arrow([[790, 750], [790, 790], [550, 790], [550, 750]], { from: "check", to: "draft", stroke: "#e67700", dash: "dashed" });
text("blocked, so it writes it again", 600, 796, { size: 13, color: QUIET });

/* ----------------------------------------------- studio hands two things down */

arrow([[455, 420], [550, 650]], { from: "steer", to: "draft", stroke: "#5f3dc4" });
arrow([[735, 420], [850, 650]], { from: "gate", to: "check", stroke: "#5f3dc4" });

text("Two things, published once.\nThe pipeline loads them and runs.", 150, 480, { size: 13, color: "#5f3dc4" });

/* ------------------------------------------------------ the return: watching */

arrow([[1410, 650], [1525, 290]], { from: "out", to: "notice", stroke: "#5f3dc4", weight: 3, dash: "dashed" });
text("Studio reads what already went out.\nIt is never in the path, so it can never be the bottleneck.", 900, 480, { size: 14, color: "#5f3dc4" });

/* --------------------------------------------------------------- core's API */

box("lint", 750, 980, 200, 90, "lint\nthe craft floor", CORE);
box("verify", 1010, 980, 200, 90, "verify\ndo the targets still resolve", { ...CORE, size: 15 });
box("render", 1270, 980, 200, 90, "render\nscreenplay in, film out", CORE);

arrow([[850, 750], [850, 980]], { from: "check", to: "lint", stroke: "#2f9e44" });
arrow([[1090, 750], [1110, 980]], { from: "film", to: "verify", stroke: "#2f9e44" });
arrow([[1180, 750], [1370, 980]], { from: "film", to: "render", stroke: "#2f9e44" });

text("Studio's gate calls core's own lint,\nso the craft floor is the same in both.", 150, 985, { size: 14, color: "#2f9e44" });

text("Studio only uses core's public API.\nWhen Studio needs something new, it goes\ninto core first, gets released, then flows here.", 150, 1035, { size: 13, color: QUIET });

/* ------------------------------------------------------------------- write */

const out = fileURLToPath(new URL("./core-and-studio.excalidraw", import.meta.url));
await writeFile(out, JSON.stringify(toJSON(), null, 2) + "\n");
console.log(`\u00b7 ${elements.length} elements \u2192 ${out}`);
