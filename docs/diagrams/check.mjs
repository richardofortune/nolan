#!/usr/bin/env node
/**
 * Check the generated scene against the real Excalidraw.
 *
 * Our own SVG preview proves the geometry, not that Excalidraw will open the
 * file. This serves check.html, loads it, and reports what Excalidraw's own
 * restore() did with the scene. Exits 1 if it dropped anything.
 *
 *   npm run diagram:check
 *
 * Needs playwright (already a peer dependency) and network access, since the
 * page pulls Excalidraw from a CDN.
 */
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const TYPES = { ".html": "text/html; charset=utf-8", ".excalidraw": "application/json", ".svg": "image/svg+xml" };

const server = createServer(async (req, res) => {
  const name = req.url.split("?")[0].replace(/^\//, "") || "check.html";
  if (name.includes("..")) return res.writeHead(403).end("no");
  try {
    const body = await readFile(join(ROOT, name));
    res.writeHead(200, { "content-type": TYPES[extname(name)] ?? "text/plain", "cache-control": "no-store" }).end(body);
  } catch {
    res.writeHead(404).end("not here");
  }
});

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const scenes = process.argv.slice(2);
const list = scenes.length
  ? scenes
  : (await readdir(ROOT)).filter((f) => f.endsWith(".excalidraw")).map((f) => f.replace(/\.excalidraw$/, "")).sort();
const base = `http://127.0.0.1:${server.address().port}/check.html`;

const { chromium } = await import("playwright");
const browser = await chromium.launch();
let bad = 0;
for (const scene of list) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(`${base}?scene=${scene}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => !document.getElementById("status").textContent.includes("loading"), { timeout: 20000 });
  const status = (await page.textContent("#status")).trim();
  await page.close();
  console.log(`· ${scene}: ${status}`);
  if (!status.includes("nothing dropped")) bad++;
}
await browser.close();
server.close();

if (bad) {
  console.error(`Excalidraw would not open ${bad} of these cleanly.`);
  process.exit(1);
}
