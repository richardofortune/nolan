#!/usr/bin/env node
/**
 * nolan — direct your app, get a film.
 *
 *   nolan demo.screenplay.json                  film the first cut
 *   nolan demo.screenplay.json --cut=hero       film a named cut
 *   nolan demo.screenplay.json --out=docs       where the files land
 *   nolan demo.screenplay.json --style=mine.json
 *   nolan verify demo.screenplay.json           resolve every target, film nothing
 */
import { render, verify, DEFAULT_STYLE } from "../src/render.mjs";

const USAGE = `nolan — screenplay-driven demo films for web apps

  nolan <screenplay.json> [options]      film it
  nolan verify <screenplay.json> [opts]  check every target still resolves

Options
  --cut=<name>     which cut to film (default: the first in "cuts")
  --out=<dir>      output directory   (default: <screenplay dir>/out)
  --style=<path>   style document     (default: ${DEFAULT_STYLE})
  --quiet          only print errors

Docs: https://github.com/richardofortune/nolan`;

async function main(argv) {
  const args = argv.slice(2);
  if (!args.length || args.includes("--help") || args.includes("-h")) {
    console.log(USAGE);
    return args.length ? 0 : 1;
  }

  const flag = (n) => {
    const hit = args.find((a) => a.startsWith(`--${n}=`));
    return hit ? hit.slice(n.length + 3) : undefined;
  };
  const opts = {
    cut: flag("cut"),
    out: flag("out"),
    style: flag("style"),
    quiet: args.includes("--quiet"),
  };

  const verifying = args[0] === "verify";
  const positional = args.filter((a) => !a.startsWith("--") && a !== "verify");
  const file = positional[0];
  if (!file) {
    console.error("nolan: no screenplay given\n");
    console.log(USAGE);
    return 1;
  }

  if (verifying) {
    const problems = await verify(file, opts);
    if (!problems.length) {
      console.log("✓ every target resolves — this screenplay still describes the app");
      return 0;
    }
    console.error(`✗ ${problems.length} target(s) no longer resolve:\n`);
    for (const p of problems) console.error(`  [${p.scene}] ${p.beat}: ${p.error}`);
    console.error("\nThe app moved under the screenplay. Update the beats, or the demo will lie.");
    return 1;
  }

  await render(file, opts);
  return 0;
}

main(process.argv)
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error("✗", err.message);
    process.exit(1);
  });
