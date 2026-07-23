#!/usr/bin/env node
/**
 * Embed the template library into the style desk.
 *
 * styles/templates/*.json are the canonical, `--style=`-usable template files.
 * The desk (editor/style-desk.html) is a single self-contained page, so it can't
 * read them at runtime — this inlines them into its `const TEMPLATES = { … }`
 * block for one-click "New from template". Run it whenever a template file
 * changes; `npm run desk:check` fails if the embed has drifted.
 *
 *   node editor/embed-templates.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const tdir = join(here, "..", "styles", "templates");
const deskPath = join(here, "style-desk.html");

const files = readdirSync(tdir).filter((f) => f.endsWith(".json")).sort();
const entries = files.map((f) => {
  const key = basename(f, ".json");
  const obj = JSON.parse(readFileSync(join(tdir, f), "utf8"));
  return JSON.stringify(key) + ": " + JSON.stringify(obj);
});
const block = "const TEMPLATES = {\n" + entries.join(",\n") + "\n};";

let desk = readFileSync(deskPath, "utf8");
const re = /const TEMPLATES = \{[\s\S]*?\};/;
if (!re.test(desk)) {
  console.error("could not find a `const TEMPLATES = { … };` block/placeholder in style-desk.html");
  process.exit(1);
}
writeFileSync(deskPath, desk.replace(re, block));
console.log(`embedded ${files.length} template(s) into style-desk.html: ${files.map((f) => basename(f, ".json")).join(", ")}`);
