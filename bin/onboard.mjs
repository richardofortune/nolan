#!/usr/bin/env node
/**
 * Onboarding menu — `npm start`.
 *
 * A friendly first run: pick something to see and nolan films it. Everything
 * here just shells out to the same `bin/nolan.mjs` the CLI uses, so the menu is
 * a guided tour, not a second code path.
 */
import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { platform, stdin, stdout } from "node:process";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const NOLAN = resolve(HERE, "nolan.mjs");

/* ------------------------------ little helpers ---------------------------- */
const C = {
  b: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
};
const has = (cmd) => {
  try { execSync(`command -v ${cmd}`, { stdio: "ignore" }); return true; } catch { return false; }
};
const hasFfmpeg = has("ffmpeg");
let hasPlaywright = false;
try { createRequire(import.meta.url).resolve("playwright"); hasPlaywright = true; } catch {}

/* --------------------------------- the menu -------------------------------- */
// Each film option is `args` passed to bin/nolan.mjs. `net` marks ones that
// reach a live site; `steps` runs several commands in order (e.g. restyle).
const ITEMS = [
  { group: "See it work — no internet needed", items: [
    { k: "1", label: "Film the toy app — the classic hero GIF",
      args: ["examples/splitter.screenplay.json", "--cut=hero"], opens: "examples/out/splitter-hero.gif" },
    { k: "2", label: "The self-describing showcase — every feature, narrated",
      args: ["examples/showcase.screenplay.json", "--cut=full", "--style=examples/showcase.style.json", "--overlay=post", "--out=examples/out"], opens: "examples/out/showcase-full.gif" },
  ]},
  { group: "Live public sites — needs internet", items: [
    { k: "3", label: "Wikipedia — search and read", net: true,
      args: ["examples/wikipedia.screenplay.json", "--cut=full", "--overlay=post", "--out=examples/out"], opens: "examples/out/wikipedia-full.gif" },
    { k: "4", label: "Google Calendar — styled captions + a presenter", net: true,
      args: ["examples/gcal.screenplay.json", "--cut=full", "--style=examples/gcal.style.json", "--overlay=post", "--out=examples/out"], opens: "examples/out/gcal-full.gif" },
    { k: "5", label: "Karaoke captions — words light up", net: true,
      args: ["examples/karaoke.screenplay.json", "--cut=full", "--style=examples/karaoke.style.json", "--out=examples/out"], opens: "examples/out/karaoke-full.gif" },
    { k: "6", label: "Airbnb — a fun place-hunt " + C.dim("(may hit bot checks)"), net: true,
      args: ["examples/airbnb.screenplay.json", "--cut=full", "--style=examples/showcase.style.json", "--overlay=post", "--out=examples/out"], opens: "examples/out/airbnb-full.gif" },
  ]},
  { group: "Concepts", items: [
    { k: "7", label: "verify — catch a stale demo (films nothing, ~2s)", light: true,
      args: ["verify", "examples/splitter.screenplay.json"] },
    { k: "8", label: "restyle — re-caption without re-filming",
      steps: [
        ["examples/splitter.screenplay.json", "--cut=hero", "--overlay=post", "--out=examples/out"],
        ["restyle", "examples/out/splitter-hero.segments.json", "--style=examples/karaoke.style.json", "--out=examples/out"],
      ], opens: "examples/out/splitter-hero.gif" },
    { k: "9", label: "How it works — the three documents", about: true },
  ]},
];
const byKey = new Map(ITEMS.flatMap((g) => g.items).map((it) => [it.k, it]));

const ABOUT = `
${C.b("The whole design is one split — three documents, three owners:")}

  ${C.cyan("Screenplay")}  ${C.dim("*.screenplay.json")}   WHAT to show — an agent writes it, per person or moment
  ${C.cyan("Style + voice")} ${C.dim("styles/*.json")}     HOW it looks and speaks — your brand, reused everywhere
  ${C.cyan("Engine")}     ${C.dim("src/")}                drives the browser, films, narrates — you never touch it

Because ${C.b("what")} is shown is separate from ${C.b("how")} it's delivered, the content stays
personal while the voice stays unmistakably yours — and restyling every
walkthrough you own is one file and a re-render, not a re-shoot.
`;

/* --------------------------------- running --------------------------------- */
function run(args) {
  return new Promise((done) => {
    const p = spawn("node", [NOLAN, ...args], { cwd: ROOT, stdio: "inherit" });
    p.on("close", (code) => done(code ?? 0));
  });
}

/** Open a rendered file in the OS default viewer — best-effort, never fatal. */
function openFile(rel) {
  const file = resolve(ROOT, rel);
  if (!existsSync(file)) return;
  const [cmd, args] =
    platform === "darwin" ? ["open", [file]]
    : platform === "win32" ? ["cmd", ["/c", "start", "", file]]
    : ["xdg-open", [file]];
  try {
    spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
    console.log(C.dim(`  opening ${rel} …`));
  } catch { /* no GUI / no opener — the path is printed above anyway */ }
}

function banner() {
  console.log(`\n${C.b("nolan")} ${C.dim("— let your agents show, not just tell")}`);
  const fmt = (ok, name, fix) =>
    ok ? C.green("✓ " + name) : C.red("✗ " + name) + C.dim("  " + fix);
  console.log(
    "  " + fmt(hasFfmpeg, "ffmpeg", "brew install ffmpeg") +
    "   " + fmt(hasPlaywright, "Playwright", "npm i playwright && npx playwright install chromium") + "\n",
  );
}

function menu() {
  for (const g of ITEMS) {
    console.log(C.dim("  " + g.group));
    for (const it of g.items) console.log(`    ${C.b(it.k)}) ${it.label}`);
    console.log("");
  }
  console.log(`    ${C.b("q")}) quit\n`);
}

async function main() {
  banner();
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    for (;;) {
      menu();
      const raw = await rl.question(C.cyan("Pick one › ")).catch(() => null);
      if (raw == null) break; // stdin closed (EOF)
      const ans = raw.trim().toLowerCase();
      if (ans === "q" || ans === "quit" || ans === "") { console.log("\nHappy filming.\n"); break; }
      const it = byKey.get(ans);
      if (!it) { console.log(C.yellow("  ? try a number, or q to quit\n")); continue; }

      if (it.about) { console.log(ABOUT); continue; }

      const needsBrowser = !it.light || false; // verify + every film needs Playwright
      if (needsBrowser && !hasPlaywright) {
        console.log(C.yellow("\n  Playwright isn't installed yet — this needs it:"));
        console.log("    npm install playwright && npx playwright install chromium\n");
        continue;
      }
      if (!it.light && !hasFfmpeg) {
        console.log(C.yellow("\n  ffmpeg isn't installed yet — encoding needs it:  brew install ffmpeg\n"));
        continue;
      }
      if (it.net) console.log(C.dim("\n  (this one films a live website — needs internet)\n"));

      const runs = it.steps ?? [it.args];
      let code = 0;
      for (const args of runs) { code = await run(args); if (code !== 0) break; }
      if (code === 0) {
        console.log(C.green("\n  ✓ done — outputs are in examples/out/\n"));
        if (it.opens) openFile(it.opens);
      } else {
        console.log(C.yellow("\n  the run exited early (a live site may have blocked it — try again)\n"));
      }
    }
  } finally {
    rl.close();
  }
}

main();
