#!/usr/bin/env node
/**
 * Screenplay renderer — a spike.
 *
 * Reads a declarative screenplay (WHAT happens) plus a style document (HOW it
 * looks and how fast), drives a real browser, and encodes the result. The point
 * of the split:
 *
 *   - an agent can generate/edit the screenplay without writing code
 *   - you can restyle overlays, re-pace, or swap captions for voiceover by
 *     editing style.json alone — every screenplay you own re-renders
 *   - the same screenplay yields several cuts (hero / full) and several
 *     encodings (gif / mp4) from one recording pass
 *
 * Usage:
 *   node scripts/screenplay/render.mjs <screenplay.json> [--cut=hero] [--style=path] [--out=dir]
 *
 * Beat vocabulary (the `do` field):
 *   goto      {url, widget?}          navigate
 *   cut       {url, title, ms, widget?}  curtained navigation (scene change)
 *   card      {lines[], ms}           full-screen title card
 *   actor     {who}                   set the persona chip
 *   say       {text, hold?, lead?}    narrate; duration DERIVED from length
 *   hold      {ms}                    explicit pause (pace-scaled)
 *   move      {to}                    glide the cursor
 *   click     {to, settle?}           glide + click
 *   type      {text, delay?}          keyboard input
 *   scrollTo  {to}                    scroll a target to viewport centre
 *   call      {fn, args[]}            invoke a page API (film surfaces)
 *   http      {method,url,headers,body,as?}  real backend call; bind response
 *   set       {name, from, where?, pick?}    derive a variable from bound data
 *   js        {code, args?}           ESCAPE HATCH — raw page.evaluate
 *
 * Targets (`to`): {sel}, {shadow}, {role,name}, {text}, or {x,y}.
 * Any string field supports {{var.path|filter}} interpolation.
 */
import { chromium } from "playwright";
import { spawn, execSync } from "node:child_process";
import { mkdirSync, rmSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";


/* ----------------------------- interpolation ----------------------------- */

const FILTERS = {
  truncate: (v, n) => (String(v).length > +n ? String(v).slice(0, +n) + "…" : String(v)),
  upper: (v) => String(v).toUpperCase(),
  plural: (v, one, many) => (+v === 1 ? `${v} ${one}` : `${v} ${many}`),
};

function dig(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

/** "{{good.body|truncate:50}}" → resolved string. Non-string values pass through. */
export function interp(value, vars) {
  if (typeof value !== "string") return value;
  return value.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    const [path, ...filters] = expr.split("|").map((s) => s.trim());
    let out = dig(vars, path);
    for (const f of filters) {
      const [name, ...args] = f.split(":");
      if (FILTERS[name]) out = FILTERS[name](out, ...args);
    }
    return out == null ? "" : String(out);
  });
}

function interpDeep(node, vars) {
  if (Array.isArray(node)) return node.map((n) => interpDeep(n, vars));
  if (node && typeof node === "object") {
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, interpDeep(v, vars)]));
  }
  return interp(node, vars);
}

/* ------------------------------- the rig --------------------------------- */
/**
 * Overlays are injected from STYLE, not hardcoded. Changing caption colour or
 * the click-highlight radius is a style edit + re-render, never a code edit.
 */
export function rigScript(style) {
  const c = style.caption;
  const cur = style.cursor;
  return `(() => {
  const S = ${JSON.stringify({ caption: c, cursor: cur })};
  if (!document.getElementById('film-cap')) {
    const bar = document.createElement('div');
    bar.id = 'film-cap';
    bar.style.cssText = 'position:fixed;' + (S.caption.position === 'top' ? 'top:0;' : 'bottom:0;') +
      'left:0;right:0;z-index:2147483646;background:' + S.caption.bg + ';color:' + S.caption.ink +
      ';font:' + S.caption.font + ';padding:' + S.caption.padding +
      ';min-height:' + (S.caption.height - 24) + 'px;display:flex;align-items:center;gap:13px;box-shadow:0 -1px 8px rgba(0,0,0,.3)';
    bar.innerHTML =
      '<span id="film-chip" style="display:none;align-items:center;gap:8px;flex:none;transition:opacity .3s">' +
      '<span id="film-av" style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;font:600 12px ui-monospace,Menlo,monospace"></span>' +
      '<span id="film-name" style="font-size:14px;color:#c9cdd4;white-space:nowrap"></span>' +
      '<span style="color:#3a3e46">|</span></span><span id="film-text" style="flex:1"></span>';
    document.body.appendChild(bar);
  }
  window.__actor = (kind, name, bg, ink) => {
    if (!S.caption.showChip) return;
    const chip = document.getElementById('film-chip'), av = document.getElementById('film-av');
    chip.style.display = 'flex';
    av.style.background = bg; av.style.color = ink;
    av.style.borderRadius = kind === 'agent' ? '5px' : '50%';
    av.textContent = kind === 'agent' ? '▸' : name[0];
    document.getElementById('film-name').textContent = name;
    chip.style.opacity = '0';
    requestAnimationFrame(() => { chip.style.opacity = '1'; });
  };
  window.__cap = (t, speed) => new Promise((done) => {
    const el = document.getElementById('film-text'); let i = 0;
    (function tick(){ i++; el.textContent = t.slice(0,i) + (i<t.length ? S.caption.caret : '');
      if (i<t.length) setTimeout(tick, speed); else done(); })();
  });
  if (S.cursor.show && !document.getElementById('film-cursor')) {
    const cur = document.createElement('div');
    cur.id = 'film-cursor';
    cur.style.cssText = 'position:fixed;left:0;top:0;width:'+S.cursor.size+'px;height:'+S.cursor.size+'px;z-index:2147483647;pointer-events:none;transform:translate(-2px,-2px)';
    cur.innerHTML = '<svg viewBox="0 0 24 24" width="'+S.cursor.size+'" height="'+S.cursor.size+'"><path d="M5 3l14 9-6.5 1L9 19z" fill="'+S.cursor.fill+'" stroke="'+S.cursor.stroke+'" stroke-width="1.4"/></svg>';
    document.body.appendChild(cur);
    document.addEventListener('mousemove', (e) => {
      cur.style.left = e.clientX+'px'; cur.style.top = e.clientY+'px'; }, true);
    const K = S.cursor.click;
    if (K.show) document.addEventListener('mousedown', (e) => {
      const r = document.createElement('div');
      r.style.cssText = 'position:fixed;z-index:2147483645;pointer-events:none;border:'+K.width+'px solid '+K.colour+
        ';border-radius:50%;width:'+K.from+'px;height:'+K.from+'px;left:'+(e.clientX-K.from/2)+'px;top:'+(e.clientY-K.from/2)+
        'px;opacity:.95;transition:all '+(K.ms/1000)+'s ease-out';
      document.body.appendChild(r);
      requestAnimationFrame(() => { r.style.width=K.to+'px'; r.style.height=K.to+'px';
        r.style.left=(e.clientX-K.to/2)+'px'; r.style.top=(e.clientY-K.to/2)+'px'; r.style.opacity='0'; });
      setTimeout(() => r.remove(), K.ms + 60);
    }, true);
  }
})();`;
}

/* ------------------------------ the engine ------------------------------- */

export class Director {
  constructor(page, screenplay, style, cut) {
    this.page = page;
    this.sp = screenplay;
    this.style = style;
    this.cut = cut;
    this.pace = (cut.pace ?? 1) * (style.pace ?? 1);
    this.vars = { ...(screenplay.vars || {}), ...(cut.vars || {}) };
    this.manifest = []; // timestamped beat log — the seed of post-compositing
    this.t0 = Date.now();
    // How long to wait for a target before calling it missing. Filming allows
    // for slow app state; `verify` drops this so CI fails in seconds, not
    // minutes, and reports every broken beat instead of timing out on the first.
    this.targetTimeout = 30000;
  }

  sleep(ms) { return new Promise((r) => setTimeout(r, Math.round(ms * this.pace))); }

  log(beat, extra = {}) {
    this.manifest.push({ at: Date.now() - this.t0, do: beat.do, ...extra });
  }

  /** Duration a caption needs. DERIVED — swap to audio length for voiceover. */
  captionMs(text) {
    const t = this.style.timing;
    return Math.max(t.minCaption, text.length * t.readingSpeed);
  }

  async rig() {
    await this.page.evaluate(rigScript(this.style)).catch(() => {});
    // App-specific DOM handling (hiding a dev banner, nudging a widget's own
    // controls clear of the caption bar) lives in the SCREENPLAY, never in the
    // engine. Keeping the engine ignorant of any one app is the whole point of
    // the split — otherwise every new app grows another branch in here.
    for (const script of this.sp.set?.onLoad ?? []) {
      await this.page.evaluate(script).catch(() => {});
    }
  }

  /** Resolve a target to viewport coordinates. Semantic first, pixels last. */
  async point(to) {
    if (to.x != null && to.y != null) return { x: to.x, y: to.y };
    // Shadow-DOM targets. The HOST is supplied by the screenplay
    // (`set.shadowHost`, or per-target `host`) — the engine must never know
    // any one app's element names.
    if (to.shadow || to.shadowText) {
      const host = to.host ?? this.sp.set?.shadowHost;
      if (!host) {
        throw new Error("shadow target needs `set.shadowHost` (or a per-target `host`)");
      }
      const p = await this.page.evaluate(
        ([hostSel, sel, needle]) => {
          const root = document.querySelector(hostSel)?.shadowRoot;
          if (!root) return null;
          const el = sel
            ? root.querySelector(sel)
            : [...root.querySelectorAll("button, a, [role=button]")]
                .find((b) => new RegExp(needle, "i").test(b.textContent || ""));
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        },
        [host, to.shadow ?? null, to.shadowText ?? null],
      );
      if (!p) throw new Error(`not found in ${host} shadow root: ${to.shadow ?? to.shadowText}`);
      return p;
    }
    const opts = { timeout: this.targetTimeout };
    if (to.role && to.name) {
      const el = this.page.getByRole(to.role, { name: to.name }).first();
      const b = await el.boundingBox(opts).catch(() => null);
      if (!b) throw new Error(`no visible ${to.role} named "${to.name}"`);
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    }
    const b = await this.page.locator(to.sel).first().boundingBox(opts).catch(() => null);
    if (!b) throw new Error(`no visible element matching "${to.sel}"`);
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  }

  async glide(x, y, ms) {
    const steps = Math.max(8, Math.round((ms * this.pace) / 16));
    await this.page.mouse.move(x, y, { steps });
  }

  async run(beat) {
    const b = interpDeep(beat, this.vars);
    const t = this.style.timing;
    this.log(b);
    switch (b.do) {
      case "goto":
        await this.page.goto(b.url, { waitUntil: "domcontentloaded" });
        await this.sleep(b.settle ?? 350);
        await this.rig();
        break;

      case "cut": {
        await this.page.evaluate(
          ([col, title, font, ink, fade]) => {
            const c = document.createElement("div");
            c.id = "film-curtain";
            c.style.cssText = `position:fixed;inset:0;z-index:2147483647;background:${col};display:flex;align-items:center;justify-content:center;color:${ink};font:${font};opacity:0;transition:opacity ${fade}ms`;
            c.textContent = title || "";
            document.body.appendChild(c);
            requestAnimationFrame(() => (c.style.opacity = "1"));
          },
          [this.style.transition.curtain, b.title, this.style.transition.titleFont,
            this.style.transition.titleInk, this.style.transition.fadeMs],
        ).catch(() => {});
        await this.sleep(this.style.transition.fadeMs + 60);
        await this.sleep(b.ms ?? 900);
        await this.page.goto(b.url, { waitUntil: "domcontentloaded" });
        await this.sleep(300);
        await this.rig();
        if (b.after) for (const inner of b.after) await this.run(inner);
        await this.page.evaluate(
          ([col, title, font, ink, fade]) => {
            let c = document.getElementById("film-curtain");
            if (!c) {
              c = document.createElement("div");
              c.id = "film-curtain";
              c.style.cssText = `position:fixed;inset:0;z-index:2147483647;background:${col};display:flex;align-items:center;justify-content:center;color:${ink};font:${font};opacity:1;transition:opacity ${fade}ms`;
              c.textContent = title || "";
              document.body.appendChild(c);
            }
            requestAnimationFrame(() => (c.style.opacity = "0"));
            setTimeout(() => c.remove(), fade + 40);
          },
          [this.style.transition.curtain, b.title, this.style.transition.titleFont,
            this.style.transition.titleInk, this.style.transition.fadeMs],
        ).catch(() => {});
        await this.sleep(this.style.transition.fadeMs);
        break;
      }

      case "card":
        await this.page.evaluate(
          ([lines, col, ink, fade]) => {
            const c = document.createElement("div");
            c.id = "film-card";
            c.style.cssText = `position:fixed;inset:0;z-index:2147483647;background:${col};color:${ink};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;opacity:0;transition:opacity ${fade}ms;text-align:center;padding:0 60px`;
            c.innerHTML = lines.map((l) =>
              `<div style="font:${l.font || "500 20px -apple-system,sans-serif"};color:${l.ink || ink};opacity:${l.dim ? 0.72 : 1}">${l.text}</div>`).join("");
            document.body.appendChild(c);
            requestAnimationFrame(() => (c.style.opacity = "1"));
          },
          [b.lines, this.style.transition.curtain, this.style.transition.titleInk, this.style.transition.fadeMs],
        );
        await this.sleep(b.ms ?? 2200);
        await this.page.evaluate((fade) => {
          const c = document.getElementById("film-card");
          if (!c) return;
          c.style.opacity = "0";
          setTimeout(() => c.remove(), fade + 40);
        }, this.style.transition.fadeMs);
        await this.sleep(this.style.transition.fadeMs);
        break;

      case "actor": {
        const who = this.sp.cast[b.who];
        await this.page.evaluate(
          ([kind, name, bg, ink]) => window.__actor?.(kind, name, bg, ink),
          [who.kind, who.name, who.bg, who.ink],
        ).catch(() => {});
        break;
      }

      case "say":
        await this.sleep(b.lead ?? t.leadIn);
        await this.page.evaluate(
          ([text, speed]) => window.__cap?.(text, speed),
          [b.text, t.readingSpeed],
        ).catch(() => {});
        // DERIVED duration: text length now, audio length under voiceover.
        await this.sleep(b.hold ?? Math.max(t.beatOut, this.captionMs(b.text) - b.text.length * t.readingSpeed));
        break;

      case "hold":
        await this.sleep(b.ms);
        break;

      case "move": {
        const p = await this.point(b.to);
        await this.glide(p.x, p.y, b.ms ?? t.glideDefault);
        break;
      }

      case "click": {
        const p = await this.point(b.to);
        await this.glide(p.x, p.y, b.ms ?? t.glideDefault);
        await this.sleep(b.pause ?? 200);
        await this.page.mouse.down();
        await this.page.mouse.up();
        await this.sleep(b.settle ?? t.settle);
        break;
      }

      case "type":
        await this.page.keyboard.type(b.text, { delay: b.delay ?? t.typeDelay });
        await this.sleep(b.settle ?? 200);
        break;

      case "scrollTo":
        await this.page.evaluate((sel) => {
          document.querySelector(sel)?.scrollIntoView({ block: "center", behavior: "instant" });
        }, b.to.sel);
        await this.sleep(b.settle ?? 350);
        break;

      case "call":
        await this.page.evaluate(
          ([fn, args]) => window[fn]?.(...args),
          [b.fn, b.args ?? []],
        );
        await this.sleep(b.settle ?? 0);
        break;

      case "http": {
        const res = await fetch(b.url, {
          method: b.method ?? "GET",
          headers: b.headers ?? {},
          ...(b.body ? { body: JSON.stringify(b.body) } : {}),
        });
        if (b.as) {
          const ct = res.headers.get("content-type") || "";
          this.vars[b.as] = ct.includes("json") ? await res.json() : await res.text();
        }
        break;
      }

      case "set": {
        // Derive a variable without dropping to code: pick the first item in a
        // bound collection matching `where`, or by index.
        const src = dig(this.vars, b.from);
        let out = src;
        if (Array.isArray(src)) {
          if (b.where) {
            const re = new RegExp(b.where.matches, "i");
            out = src.find((i) => re.test(String(dig(i, b.where.field) ?? "")));
          } else if (b.not) {
            const excl = dig(this.vars, b.not);
            out = src.find((i) => i.id !== excl?.id);
          } else {
            out = src[b.index ?? 0];
          }
        }
        this.vars[b.name] = out ?? b.fallback ?? null;
        break;
      }

      case "js": // escape hatch — see README on why this exists
        await this.page.evaluate(new Function("a", b.code), b.args ?? null);
        await this.sleep(b.settle ?? 0);
        break;

      default:
        throw new Error(`unknown beat: ${b.do}`);
    }
  }

  wanted(beat) {
    if (beat.cuts && !beat.cuts.includes(this.cut.name)) return false;
    if (beat.notCuts && beat.notCuts.includes(this.cut.name)) return false;
    return true;
  }

  async play() {
    for (const scene of this.sp.scenes) {
      if (!this.wanted(scene)) continue;
      for (const beat of scene.beats) {
        if (!this.wanted(beat)) continue;
        try {
          await this.run(beat);
        } catch (err) {
          // A missing target means the UI moved under the screenplay. For a
          // README demo that's annoying; for a help doc it is the whole point —
          // fail loudly rather than film something wrong.
          throw new Error(`[${scene.id}] beat ${beat.do}: ${err.message}`);
        }
      }
    }
  }
}

/* ------------------------------- the set --------------------------------- */

export async function waitHttp(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try { await fetch(url); return; } catch { await new Promise((r) => setTimeout(r, 500)); }
  }
  throw new Error("set never came up: " + url);
}

/**
 * Bring up whatever the screenplay needs to film against. `cwd` is resolved
 * relative to the SCREENPLAY's directory, so a screenplay is portable: it
 * describes its own set in terms of where it lives, not where nolan lives.
 */
export async function bringUpSet(sp, baseDir) {
  const procs = [];
  for (const s of sp.set?.servers ?? []) {
    procs.push(spawn(s.cmd, s.args, { cwd: resolve(baseDir, s.cwd ?? "."), stdio: "ignore" }));
  }
  for (const url of sp.set?.waitFor ?? []) await waitHttp(url);
  return () => procs.forEach((p) => p.kill());
}
