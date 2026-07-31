/**
 * Minimal Excalidraw scene builder.
 *
 * Excalidraw's file format is plain JSON, so diagrams here are generated rather
 * than hand-drawn. That keeps them diffable, keeps layout honest when the model
 * changes, and stays dependency-free like the rest of the repo.
 *
 * Everything is deterministic, so regenerating an unchanged diagram gives an
 * unchanged file.
 */

/** Virgil is wide. This only has to be close: Excalidraw re-measures on load. */
export const measure = (text, size) => {
  const lines = text.split("\n");
  return {
    w: Math.max(...lines.map((l) => l.length)) * size * 0.53,
    h: lines.length * size * 1.25,
  };
};

export function scene({ seed: start = 20260729 } = {}) {
  let seed = start;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648);

  let n = 0;
  const idx = () => `a${(n++).toString(36).padStart(4, "0")}`;

  const elements = [];
  const byId = new Map();
  const push = (el) => (elements.push(el), byId.set(el.id, el), el);

  const common = (id, type, x, y, width, height) => ({
    id, type, x, y, width, height,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    index: idx(),
    seed: rnd(),
    version: 1,
    versionNonce: rnd(),
    isDeleted: false,
    boundElements: [],
    updated: 1,
    link: null,
    locked: false,
    roundness: null,
  });

  const text = (t, x, y, { size = 16, color = "#1e1e1e", align = "left", width } = {}) => {
    const m = measure(t, size);
    return push({
      ...common(`t${idx()}`, "text", x, y, width ?? m.w, m.h),
      strokeColor: color,
      fontSize: size,
      fontFamily: 1,
      text: t,
      originalText: t,
      textAlign: align,
      verticalAlign: "top",
      containerId: null,
      lineHeight: 1.25,
      autoResize: true,
    });
  };

  const box = (id, x, y, w, h, label, opts = {}) => {
    const { fill = "transparent", stroke = "#1e1e1e", weight = 2, dash = "solid", size = 16, radius = true } = opts;
    const el = push({
      ...common(id, "rectangle", x, y, w, h),
      strokeColor: stroke,
      backgroundColor: fill,
      strokeWidth: weight,
      strokeStyle: dash,
      roundness: radius ? { type: 3 } : null,
    });
    if (label) {
      const m = measure(label, size);
      const tid = `${id}-t`;
      push({
        ...common(tid, "text", x + (w - Math.min(m.w, w - 16)) / 2, y + (h - m.h) / 2, Math.min(m.w, w - 16), m.h),
        fontSize: size,
        fontFamily: 1,
        text: label,
        originalText: label,
        textAlign: "center",
        verticalAlign: "middle",
        containerId: id,
        lineHeight: 1.25,
        autoResize: false,
      });
      el.boundElements.push({ id: tid, type: "text" });
    }
    return el;
  };

  /** pts: absolute [x, y] waypoints. from/to: element ids to bind to. */
  const arrow = (pts, opts = {}) => {
    const { from, to, stroke = "#1e1e1e", weight = 2, dash = "solid", head = "arrow" } = opts;
    const [ox, oy] = pts[0];
    const rel = pts.map(([x, y]) => [x - ox, y - oy]);
    const xs = rel.map((p) => p[0]);
    const ys = rel.map((p) => p[1]);
    const id = `r${idx()}`;
    const el = push({
      ...common(id, "arrow", ox, oy, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)),
      strokeColor: stroke,
      strokeWidth: weight,
      strokeStyle: dash,
      roundness: { type: 2 },
      points: rel,
      lastCommittedPoint: null,
      startBinding: from ? { elementId: from, focus: 0, gap: 4 } : null,
      endBinding: to ? { elementId: to, focus: 0, gap: 4 } : null,
      startArrowhead: null,
      endArrowhead: head,
      elbowed: false,
    });
    for (const ref of [from, to]) if (ref) byId.get(ref).boundElements.push({ id, type: "arrow" });
    return el;
  };

  const toJSON = () => ({
    type: "excalidraw",
    version: 2,
    source: "https://github.com/richardofortune/nolan",
    elements,
    appState: { gridSize: null, viewBackgroundColor: "#ffffff" },
    files: {},
  });

  return { text, box, arrow, elements, toJSON };
}
