/**
 * Craft lint — the enforceable floor of docs/craft.md.
 *
 * Pure static analysis of a screenplay: no browser, no filming. It catches the
 * mechanical tells that make a walkthrough read as AI-written or feel unpolished
 * — em-dashes, forced triads, clichés, over-long captions, no breathing room,
 * choppy transitions — before anything is shot. `verify` asks "does the demo
 * still match the app"; `lint` asks "is the demo any good".
 *
 * Judgment (warmth, specificity, whether the arc builds) stays with the author —
 * this only enforces the rules a machine can check without taste.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// The strongest "AI wrote this" vocabulary (docs/craft.md § Tone).
const AI_WORDS = [
  "delve", "realm", "underscore", "leverage", "unlock", "elevate",
  "robust", "meticulous", "seamless", "tapestry", "testament",
];
// Cliché / antithesis-for-its-own-sake patterns.
const CLICHES = [
  { re: /\bshow,?\s+don'?t\s+tell\b/i, name: '"show, don\'t tell"' },
  { re: /\bnot just\b/i, name: '"not just X"' },
  { re: /\bit'?s not\b[^.?!]*\bit'?s\b/i, name: '"it\'s not X, it\'s Y"' },
  { re: /\bnot\b[^.,?!]*,\s*but\b/i, name: '"not X, but Y"' },
];
const HEDGES = ["may", "might", "could potentially", "generally speaking", "perhaps", "arguably"];
// Three short, comma-separated groups (needs two commas) — the rule-of-three tell.
const TRIAD = /[\w'-]+(?:\s+[\w'-]+){0,2},\s+[\w'-]+(?:\s+[\w'-]+){0,2},\s+(?:and\s+|&\s+)?[\w'-]+(?:\s+[\w'-]+){0,2}/i;
// Beats that give the eye a rest — they reset a run of captions.
const PAUSE_BEATS = new Set(["hold", "click", "type", "move", "scrollTo", "goto", "cut", "card", "step"]);

/** Findings for one caption's text. */
function lintCaption(text) {
  const out = [];
  const has = (re) => re.test(text);
  if (has(/—/)) out.push(["error", "em-dash", "em-dash in a caption — use a period or comma"]);
  for (const c of CLICHES) if (has(c.re)) out.push(["error", "cliche", `cliché / antithesis ${c.name}`]);
  for (const w of AI_WORDS) if (has(new RegExp("\\b" + w + "\\b", "i"))) out.push(["warn", "ai-word", `AI-flavoured word "${w}"`]);
  for (const h of HEDGES) if (has(new RegExp("\\b" + h.replace(/\s+/g, "\\s+") + "\\b", "i"))) out.push(["warn", "hedge", `hedging "${h}" — say it directly`]);
  const words = text.replace(/\{\{[^}]+\}\}/g, "x").split(/\s+/).filter(Boolean);
  if (words.length > 14) out.push(["warn", "length", `${words.length} words — aim 6–12; likely more than one idea`]);
  if (TRIAD.test(text)) out.push(["warn", "triad", "looks like a forced rule-of-three"]);
  return out.map(([sev, rule, msg]) => ({ sev, rule, msg }));
}

/** Lint a parsed screenplay → array of findings. Pure. */
export function lintScreenplay(sp) {
  const findings = [];
  const push = (scene, sev, rule, msg, text) => findings.push({ scene, sev, rule, msg, text });
  const cutTitles = [];

  for (const scene of sp.scenes ?? []) {
    let sayRun = 0, prevCut = false, flaggedRun = false;
    for (const beat of scene.beats ?? []) {
      if (beat.do === "say") {
        for (const f of lintCaption(beat.text ?? "")) push(scene.id, f.sev, f.rule, f.msg, beat.text);
        sayRun++;
        if (sayRun === 4 && !flaggedRun) {
          push(scene.id, "warn", "tempo", "4+ captions with no pause — let it breathe (a hold, or no caption)", beat.text);
          flaggedRun = true;
        }
      } else if (PAUSE_BEATS.has(beat.do)) {
        sayRun = 0;
        flaggedRun = false;
      }
      if (beat.do === "cut") {
        if (prevCut) push(scene.id, "warn", "cut", "back-to-back cuts feel choppy — earn each one", beat.title);
        prevCut = true;
        cutTitles.push(beat.title ?? "");
      } else if (beat.do !== "actor") {
        prevCut = false;
      }
    }
  }

  // Cut-title consistency across the film (docs/craft.md § Transitions).
  const numbered = cutTitles.filter((t) => /^\s*[\d①②③④⑤]+[).]?\s/.test(t) || /^\s*[\dⓐ]/.test(t)).length;
  if (numbered > 0 && numbered < cutTitles.length) {
    push("*", "warn", "titles", "cut titles mix numbered and unnumbered — pick one");
  }
  return findings;
}

/** Read a screenplay file and lint it. */
export function lint(screenplayPath) {
  const sp = JSON.parse(readFileSync(resolve(screenplayPath), "utf8"));
  return lintScreenplay(sp);
}
