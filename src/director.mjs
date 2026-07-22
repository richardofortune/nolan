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
 *   say       {text, as?, hold?, lead?}  narrate; `as` picks a caption variant;
 *                                       duration DERIVED from length
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
import { resolve, dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { paintPalette, resolveCaptionStyle } from "./caption.mjs";

/**
 * The presenter bubble — a webcam-style overlay of the current actor in a
 * corner, the way a screen-share tool shows the person talking. Off by default;
 * a style opts in via `presenter.show`. Like the cursor it is burned into the
 * recording (it belongs to the frame, not the page), so it works in both modes.
 * The person shown is whichever actor the screenplay last set.
 */
export const PRESENTER_DEFAULTS = {
  show: false,
  corner: "bottom-right", // top-left | top-right | bottom-left | bottom-right
  size: 150,              // px — the bubble's diameter
  shape: "circle",        // circle | rounded | square
  margin: 22,
  ring: true,
  ringColor: "#ffffff",
  ringWidth: 3,
  shadow: true,
  label: true,            // show the actor's name under the bubble
};

/** Read an actor's `cam` image into a data URI so it survives any filmed origin's CSP. */
export function resolveCam(cast = {}, baseDir = ".") {
  for (const persona of Object.values(cast)) {
    const cam = persona?.cam;
    if (!cam || /^(data:|https?:)/.test(cam)) continue; // already inline or remote
    const abs = resolve(baseDir, cam);
    if (!existsSync(abs)) continue;
    const ext = extname(abs).slice(1).toLowerCase();
    const mime = ext === "jpg" ? "jpeg" : ext === "svg" ? "svg+xml" : ext;
    persona.camData = `data:image/${mime};base64,${readFileSync(abs).toString("base64")}`;
  }
}


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
export function rigScript(style, { captions = true } = {}) {
  const { paints } = paintPalette(style);
  const cur = style.cursor;
  const presenter = { ...PRESENTER_DEFAULTS, ...(style.presenter || {}) };
  // Lift a bottom-corner bubble clear of the caption bar (which sits at the
  // bottom in both modes — burned in, or composited on later).
  const capBase = resolveCaptionStyle(style).base;
  const capBottom = capBase.position === "bottom-center" ? capBase.height : 0;
  // The cursor and click-ripple are motion — they belong to the action and are
  // always burned in. The caption bar is the thing you restyle, so in `post`
  // mode it is left out here and composited on afterwards (see composite.mjs);
  // that turns a restyle into a re-encode instead of a re-film.
  return `(() => {
  const S = ${JSON.stringify({ paints, cursor: cur, captions, presenter, capBottom })};
  const P0 = S.paints[''];
  // Trusted-Types-safe innerHTML. Sites like Google enforce
  // require-trusted-types-for 'script', which throws on a raw innerHTML= — so
  // route every assignment through a policy (created once, reused across
  // re-rigs), falling back to plain innerHTML where Trusted Types is absent.
  if (!window.__setHTML) {
    let pol = null;
    try { if (window.trustedTypes && window.trustedTypes.createPolicy)
      pol = window.trustedTypes.createPolicy('nolan-rig', { createHTML: (s) => s }); } catch (e) {}
    window.__setHTML = (el, s) => { el.innerHTML = pol ? pol.createHTML(s) : s; };
  }
  const setHTML = window.__setHTML;
  if (S.captions && !document.getElementById('film-cap')) {
    const bar = document.createElement('div');
    bar.id = 'film-cap';
    bar.style.cssText = P0.bar;
    setHTML(bar,
      '<span id="film-chip" style="display:none;align-items:center;gap:8px;flex:none;transition:opacity .3s">' +
      '<span id="film-av" style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;font:600 12px ui-monospace,Menlo,monospace"></span>' +
      '<span id="film-name" style="font-size:14px;color:#c9cdd4;white-space:nowrap"></span>' +
      '<span style="color:#3a3e46">|</span></span><span id="film-text"></span>');
    document.body.appendChild(bar);
    document.getElementById('film-text').style.cssText = P0.text;
  }
  window.__actor = (kind, name, bg, ink) => {
    if (!S.captions) return;
    const chip = document.getElementById('film-chip'), av = document.getElementById('film-av');
    // Remember the cast even if the current look hides the chip — a later
    // caption in a chip-showing variant must still know who is speaking.
    window.__castChip = { kind: kind, name: name, bg: bg, ink: ink };
    av.style.background = bg; av.style.color = ink;
    av.style.borderRadius = kind === 'agent' ? '5px' : '50%';
    av.textContent = kind === 'agent' ? '▸' : name[0];
    document.getElementById('film-name').textContent = name;
    chip.style.display = P0.showChip ? 'flex' : 'none';
    chip.style.opacity = '0';
    requestAnimationFrame(() => { chip.style.opacity = '1'; });
  };
  const esc = (s) => s.replace(/[&<>]/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[ch]));
  /**
   * Paint one caption. \`as\` names a variant from the palette; unknown names
   * fall back to the base look rather than filming nothing.
   *
   * Both reveal modes consume the SAME total time (text.length * speed), so
   * captionMs() stays true whichever look is in play — and stays true when
   * duration becomes real audio length.
   */
  window.__cap = (t, speed, as) => new Promise((done) => {
    if (!S.captions) return done();
    const P = S.paints[as || ''] || P0;
    const bar = document.getElementById('film-cap');
    const el = document.getElementById('film-text');
    const chip = document.getElementById('film-chip');
    bar.style.cssText = P.bar;
    el.style.cssText = P.text;
    chip.style.display = (P.showChip && window.__castChip) ? 'flex' : 'none';

    if (!P.activeWordHighlight) {
      let i = 0;
      el.textContent = '';
      (function tick(){ i++; el.textContent = t.slice(0,i) + (i<t.length ? P.caret : '');
        if (i<t.length) setTimeout(tick, speed); else done(); })();
      return;
    }

    // Word-level reveal. We author the caption, so word timings are derived
    // from length — no speech recognition, unlike every karaoke caption tool.
    const pill = P.highlightStyle === 'pill';
    const tr = P.wordTransition;
    setHTML(el, t.split(/(\\s+)/).map((w, i) => /^\\s+$/.test(w) || w === '' ? esc(w) :
      '<span data-w style="opacity:.28;border-radius:.32em;padding:0 .16em;margin:0 -.16em;' +
      'transition:opacity ' + tr + 's,color ' + tr + 's,background-color ' + tr + 's">' + esc(w) + '</span>').join(''));
    const words = [].slice.call(el.querySelectorAll('[data-w]'));
    if (!words.length) { done(); return; }
    const total = t.length * speed;
    const chars = words.reduce((n, s) => n + s.textContent.length, 0) || 1;
    let i = 0;
    (function step(){
      const prev = words[i-1];
      if (prev) { prev.style.color = P.color; prev.style.background = 'transparent'; }
      if (i >= words.length) { done(); return; }
      const s = words[i];
      s.style.opacity = '1';
      if (pill) { s.style.background = P.highlightColor; s.style.color = P.color; }
      else s.style.color = P.highlightColor;
      i++;
      setTimeout(step, Math.max(90, (s.textContent.length / chars) * total));
    })();
  });
  if (S.cursor.show && !document.getElementById('film-cursor')) {
    const cur = document.createElement('div');
    cur.id = 'film-cursor';
    cur.style.cssText = 'position:fixed;left:-100px;top:-100px;width:'+S.cursor.size+'px;height:'+S.cursor.size+'px;z-index:2147483647;pointer-events:none;transform:translate(-2px,-2px)';
    setHTML(cur, '<svg viewBox="0 0 24 24" width="'+S.cursor.size+'" height="'+S.cursor.size+'"><path d="M5 3l14 9-6.5 1L9 19z" fill="'+S.cursor.fill+'" stroke="'+S.cursor.stroke+'" stroke-width="1.4"/></svg>');
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
  // Presenter bubble — the "person in the corner". Built lazily on the first
  // actor so an empty ring never flashes; re-applied on re-rig (goto/cut) from
  // the remembered actor, so it persists across scene changes.
  if (S.presenter.show) {
    const R = S.presenter, radius = R.shape === 'circle' ? '50%' : R.shape === 'rounded' ? '18px' : '0';
    window.__presenter = (p) => {
      window.__curActor = p;
      let wrap = document.getElementById('film-presenter');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'film-presenter';
        const vert = R.corner.indexOf('bottom') === 0
          ? 'bottom:' + (R.margin + S.capBottom) + 'px' : 'top:' + R.margin + 'px';
        const horiz = R.corner.indexOf('right') >= 0 ? 'right:' + R.margin + 'px' : 'left:' + R.margin + 'px';
        wrap.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;' + vert + ';' + horiz +
          ';display:flex;flex-direction:column;align-items:center;gap:7px';
        setHTML(wrap,
          '<div id="film-cam" style="width:' + R.size + 'px;height:' + R.size + 'px;border-radius:' + radius +
          ';overflow:hidden;display:flex;align-items:center;justify-content:center;' +
          'font:600 ' + Math.round(R.size * 0.4) + 'px/1 -apple-system,BlinkMacSystemFont,sans-serif;' +
          (R.ring ? 'border:' + R.ringWidth + 'px solid ' + R.ringColor + ';' : '') +
          (R.shadow ? 'box-shadow:0 6px 22px rgba(0,0,0,.35);' : '') + '"></div>' +
          '<div id="film-cam-label" style="font:600 13px -apple-system,sans-serif;color:#fff;' +
          'background:rgba(20,22,27,.72);padding:3px 10px;border-radius:11px;white-space:nowrap;' +
          'box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>');
        document.body.appendChild(wrap);
      }
      const cam = document.getElementById('film-cam'), label = document.getElementById('film-cam-label');
      if (p && p.cam) {
        setHTML(cam, '<img src="' + p.cam + '" style="width:100%;height:100%;object-fit:cover" alt="">');
      } else if (p) {
        cam.textContent = '';
        cam.style.background = 'linear-gradient(155deg, rgba(255,255,255,.16), rgba(0,0,0,.16)), ' + (p.bg || '#4b5563');
        cam.style.color = p.ink || '#fff';
        cam.textContent = (p.name || '?').slice(0, 1).toUpperCase();
      }
      const named = R.label && p && p.name;
      label.textContent = named ? p.name : '';
      label.style.display = named ? 'block' : 'none';
    };
    if (window.__curActor) window.__presenter(window.__curActor);
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
    // Caption segments in the FINAL video's timeline: {id,start,end,text,as,actor}.
    // Cap's shape. In `post` mode this is all the compositor needs to draw the
    // captions back on, so restyling never re-drives the app.
    this.segments = [];
    this.actor = null; // who is currently speaking — stamped onto each segment
    this.actorCam = null; // resolved cam data URI, kept off `actor` so segments stay small
    // 'burn' captions into the film (default) or leave them for `post` compositing.
    this.overlay = "burn";
    this.t0 = Date.now();
    // How long to wait for a target before calling it missing. Filming allows
    // for slow app state; `verify` drops this so CI fails in seconds, not
    // minutes, and reports every broken beat instead of timing out on the first.
    this.targetTimeout = 30000;
  }

  sleep(ms) { return new Promise((r) => setTimeout(r, Math.round(ms * this.pace))); }

  /** Wall-clock ms into the film — i.e. a timestamp in the recorded video. */
  now() { return Date.now() - this.t0; }

  log(beat, extra = {}) {
    this.manifest.push({
      at: Date.now() - this.t0,
      do: beat.do,
      ...(beat.do === "say" ? { text: beat.text, as: beat.as ?? null } : {}),
      ...extra,
    });
  }

  /** Duration a caption needs. DERIVED — swap to audio length for voiceover. */
  captionMs(text) {
    const t = this.style.timing;
    return Math.max(t.minCaption, text.length * t.readingSpeed);
  }

  async rig() {
    await this.page.evaluate(rigScript(this.style, { captions: this.overlay === "burn" })).catch(() => {});
    // App-specific DOM handling (hiding a dev banner, nudging a widget's own
    // controls clear of the caption bar) lives in the SCREENPLAY, never in the
    // engine. Keeping the engine ignorant of any one app is the whole point of
    // the split — otherwise every new app grows another branch in here.
    for (const script of this.sp.set?.onLoad ?? []) {
      await this.page.evaluate(script).catch(() => {});
    }
    // Navigation wipes the page's copy of the actor, so re-assert it on every
    // (re-)rig — otherwise the presenter (and chip) blink out at each scene
    // change until the next `actor` beat. Runs while the cut's curtain still
    // covers the page, so the bubble is already there when it lifts.
    await this.applyActor();
  }

  /** Draw the current actor's presenter bubble (both modes) and chip (burn). */
  async applyActor() {
    if (!this.actor) return;
    const a = this.actor;
    await this.page.evaluate((p) => window.__presenter?.(p), { ...a, cam: this.actorCam }).catch(() => {});
    if (this.overlay === "burn") {
      await this.page.evaluate(
        ([kind, name, bg, ink]) => window.__actor?.(kind, name, bg, ink),
        [a.kind, a.name, a.bg, a.ink],
      ).catch(() => {});
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
            const cardHtml = lines.map((l) =>
              `<div style="font:${l.font || "500 20px -apple-system,sans-serif"};color:${l.ink || ink};opacity:${l.dim ? 0.72 : 1}">${l.text}</div>`).join("");
            if (window.__setHTML) window.__setHTML(c, cardHtml); else c.innerHTML = cardHtml;
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
        // Remember the persona whichever mode we're in — a `post`-composited
        // caption still needs to draw the right chip. `cam` (a data URI) is kept
        // on the Director, never inside `actor`, which rides on every segment.
        this.actor = { kind: who.kind, name: who.name, bg: who.bg, ink: who.ink };
        this.actorCam = who.camData ?? (/^(data:|https?:)/.test(who.cam ?? "") ? who.cam : null);
        await this.applyActor();
        break;
      }

      case "say": {
        await this.sleep(b.lead ?? t.leadIn);
        const start = this.now();
        if (this.overlay === "burn") {
          await this.page.evaluate(
            ([text, speed, as]) => window.__cap?.(text, speed, as),
            [b.text, t.readingSpeed, b.as ?? ""],
          ).catch(() => {});
        } else {
          // No bar to type into — just hold the app for the same reveal time the
          // typewriter would take, so the clean video has an equal gap for the
          // composited caption to fill. (readingSpeed is unpaced, matching __cap.)
          await new Promise((r) => setTimeout(r, b.text.length * t.readingSpeed));
        }
        // DERIVED duration: text length now, audio length under voiceover.
        await this.sleep(b.hold ?? Math.max(t.beatOut, this.captionMs(b.text) - b.text.length * t.readingSpeed));
        // Record the segment in the video's own timeline — measured, not
        // recomputed, so it stays exact under any pace or reveal mode.
        this.segments.push({
          id: `cap-${this.segments.length}`,
          start: start / 1000,
          end: this.now() / 1000,
          text: b.text,
          as: b.as ?? null,
          actor: this.actor,
        });
        break;
      }

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
    this.finalizeSegments();
  }

  /**
   * A burned-in caption stays in the bar through the clicks and typing that
   * follow it, until the next `say` overwrites it. For post-compositing to look
   * the same, each segment must linger until the next caption starts — but never
   * across a beat that clears the screen (a `card` or `cut` covers the bar; a
   * `goto` swaps the page), or the overlay would paint over it. Both boundaries
   * are already in the manifest, so this is bookkeeping, not new timing.
   */
  finalizeSegments() {
    const clears = this.manifest
      .filter((m) => m.do === "card" || m.do === "cut" || m.do === "goto")
      .map((m) => m.at / 1000);
    this.segments.forEach((seg, i) => {
      const next = this.segments[i + 1]?.start ?? Infinity;
      const clear = clears.find((c) => c > seg.start + 1e-3) ?? Infinity;
      const limit = Math.min(next, clear);
      // Linger to the next caption, capped by any screen-clear; never shorter
      // than the reveal+hold we actually measured (unless a clear cuts in).
      let end = Number.isFinite(limit) ? Math.max(seg.end, limit) : seg.end;
      if (clear < end) end = clear;
      seg.end = Math.max(end, seg.start + 0.05);
    });
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
