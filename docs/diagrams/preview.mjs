#!/usr/bin/env node
/**
 * Render the .excalidraw scene to a flat SVG.
 *
 * The .excalidraw file is the source and stays editable. This is only a preview,
 * so it can be looked at in a browser or a README without opening Excalidraw. It
 * draws clean lines rather than Excalidraw's hand-drawn ones, so treat it as a
 * layout check, not a faithful export.
 *
 *   npm run diagram        → builds every scene
 *   node preview.mjs journey
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const name = process.argv[2] ?? "core-and-studio";
const src = fileURLToPath(new URL(`./${name}.excalidraw`, import.meta.url));
const scene = JSON.parse(await readFile(src, "utf8"));
const els = scene.elements.filter((e) => !e.isDeleted);
const byId = new Map(els.map((e) => [e.id, e]));

const PAD = 40;
const bounds = els.reduce(
  (b, e) => ({
    x0: Math.min(b.x0, e.x),
    y0: Math.min(b.y0, e.y),
    x1: Math.max(b.x1, e.x + e.width),
    y1: Math.max(b.y1, e.y + e.height),
  }),
  { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity },
);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const dash = (e) => (e.strokeStyle === "dashed" ? ` stroke-dasharray="10 7"` : "");
const out = [];

for (const e of els) {
  if (e.type === "rectangle") {
    const r = e.roundness ? 12 : 0;
    out.push(
      `<rect x="${e.x}" y="${e.y}" width="${e.width}" height="${e.height}" rx="${r}" ` +
        `fill="${e.backgroundColor}" stroke="${e.strokeColor}" stroke-width="${e.strokeWidth}"${dash(e)}/>`,
    );
  }

  if (e.type === "arrow") {
    const pts = e.points.map(([x, y]) => [e.x + x, e.y + y]);
    out.push(
      `<polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" ` +
        `stroke="${e.strokeColor}" stroke-width="${e.strokeWidth}" stroke-linejoin="round"${dash(e)}/>`,
    );
    if (e.endArrowhead) {
      const [ax, ay] = pts.at(-2);
      const [bx, by] = pts.at(-1);
      const a = Math.atan2(by - ay, bx - ax);
      const w = 6 + e.strokeWidth * 2;
      const tip = (t) => `${bx - w * Math.cos(a - t)},${by - w * Math.sin(a - t)}`;
      out.push(`<polygon points="${bx},${by} ${tip(0.45)} ${tip(-0.45)}" fill="${e.strokeColor}"/>`);
    }
  }

  if (e.type === "text") {
    const lines = e.text.split("\n");
    const lh = e.fontSize * e.lineHeight;
    const box = e.containerId ? byId.get(e.containerId) : null;
    // Bound text centres in its container. Standalone text hangs from its top edge.
    const cx = box ? box.x + box.width / 2 : e.textAlign === "center" ? e.x + e.width / 2 : e.x;
    const top = box ? box.y + (box.height - lines.length * lh) / 2 : e.y;
    const anchor = box || e.textAlign === "center" ? "middle" : "start";
    const rows = lines
      .map((l, i) => `<tspan x="${cx}" dy="${i === 0 ? 0 : lh}">${esc(l)}</tspan>`)
      .join("");
    out.push(
      `<text x="${cx}" y="${top + e.fontSize * 0.92}" text-anchor="${anchor}" fill="${e.strokeColor}" ` +
        `font-family="Segoe Print, Bradley Hand, Chalkboard SE, Comic Sans MS, sans-serif" ` +
        `font-size="${e.fontSize}">${rows}</text>`,
    );
  }
}

const w = bounds.x1 - bounds.x0 + PAD * 2;
const h = bounds.y1 - bounds.y0 + PAD * 2;
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" ` +
  `viewBox="${bounds.x0 - PAD} ${bounds.y0 - PAD} ${w} ${h}">` +
  `<rect x="${bounds.x0 - PAD}" y="${bounds.y0 - PAD}" width="${w}" height="${h}" fill="#ffffff"/>` +
  out.join("") +
  `</svg>\n`;

const dest = fileURLToPath(new URL(`./${name}.svg`, import.meta.url));
await writeFile(dest, svg);
console.log(`· ${Math.round(w)}x${Math.round(h)} → ${dest}`);
