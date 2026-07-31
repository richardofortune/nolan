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
import { render, verify, restyle, DEFAULT_STYLE } from "../src/render.mjs";
import { lint } from "../src/lint.mjs";

const USAGE = `nolan — screenplay-driven demo films for web apps

  nolan <screenplay.json> [options]        film it
  nolan verify <screenplay.json> [opts]    check every target still resolves
  nolan lint <screenplay.json> [--strict]  check the writing craft (no browser)
  nolan restyle <segments.json> [opts]     re-caption a saved master (no re-film)

Options
  --cut=<name>     which cut to film (default: the first in "cuts")
  --out=<dir>      output directory   (default: <screenplay dir>/out)
  --style=<path>   style document     (default: ${DEFAULT_STYLE})
  --overlay=<how>  captions 'burn' (default) or 'post' — post keeps a clean
                   master + segments so restyling is a re-encode, not a re-film
  --on-drift=<p>   verify only: what to do when a target no longer resolves —
                   'fail' (default, exit non-zero — the CI gate),
                   'warn'  (report it, exit 0 — a heads-up you don't own), or
                   'refresh' (report it, and re-render if the demo still resolves)
  --quiet          only print errors

Surfaces — five beats put words on screen, and they are not interchangeable
  say     the caption bar. Duration DERIVED from the text. Restylable. Linted.
  card    a full-screen title card. Fixed 'ms' you author — it does NOT scale
          with its text, and lint does not inspect it.
  cut     a titled scene change. Requires a 'url' and navigates, so it is not
          a free title card — use 'card' for a title over the current page.
  actor   the presenter chip.
  step    the how-to progress rail (needs 'steps.show' in the style).

  Only 'say' is restylable: restyle re-composites captions over a clean master,
  so card and cut text is already burned in and needs a re-film.

  timing.readingSpeed is MILLISECONDS PER CHARACTER — a higher number is a
  slower film.

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
    overlay: flag("overlay"),
    quiet: args.includes("--quiet"),
  };

  const command = ["verify", "restyle", "lint"].includes(args[0]) ? args[0] : null;
  const positional = args.filter((a) => !a.startsWith("--") && a !== command);
  const file = positional[0];
  if (!file) {
    console.error(`nolan: no ${command === "restyle" ? "segments file" : "screenplay"} given\n`);
    console.log(USAGE);
    return 1;
  }

  if (command === "restyle") {
    await restyle(file, opts);
    return 0;
  }

  if (command === "lint") {
    // Enforce the craft floor (docs/craft.md). Errors fail; warnings report but
    // pass unless --strict. `verify` checks the app; `lint` checks the writing.
    const strict = args.includes("--strict");
    const findings = lint(file);
    if (!findings.length) {
      console.log("✓ clean — reads like a person wrote it");
      return 0;
    }
    for (const f of findings) {
      console.error(`  ${f.sev === "error" ? "✗" : "⚠"} [${f.scene}] ${f.rule}: ${f.msg}`);
      if (f.text) console.error(`      ${JSON.stringify(f.text.length > 70 ? f.text.slice(0, 67) + "…" : f.text)}`);
    }
    const errors = findings.filter((f) => f.sev === "error").length;
    const warns = findings.length - errors;
    console.error(`\n${errors} error(s), ${warns} warning(s). The rules live in docs/craft.md.`);
    return errors || (strict && warns) ? 1 : 0;
  }

  if (command === "verify") {
    // Same drift detector, different response — because who owns the failure
    // differs. `fail` gates a build you control; `warn`/`refresh` suit
    // walkthroughs of sites you don't, where a red X you can't action is wrong.
    const policy = (flag("on-drift") ?? "fail").toLowerCase();
    if (!["fail", "warn", "refresh"].includes(policy)) {
      console.error(`nolan: --on-drift must be fail | warn | refresh (got "${policy}")`);
      return 1;
    }
    const problems = await verify(file, opts);

    if (!problems.length) {
      console.log("✓ every target resolves — this screenplay still describes the app");
      if (policy === "refresh") {
        console.log("· no drift — refreshing the walkthrough…");
        await render(file, opts);
      }
      return 0;
    }

    // Drift found. Report it either way; the exit code and tone are the policy.
    const mark = policy === "fail" ? "✗" : "⚠";
    console.error(`${mark} ${problems.length} target(s) no longer resolve:\n`);
    for (const p of problems) console.error(`  [${p.scene}] ${p.beat}: ${p.error}`);

    if (policy === "fail") {
      console.error("\nThe app moved under the screenplay. Update the beats, or the demo will lie.");
      return 1;
    }
    console.error(
      "\nThe target moved. " +
        (policy === "refresh"
          ? "Can't refresh a broken walkthrough — update the beats to re-enable it."
          : "This walkthrough may be stale until the beats are updated.") +
        " (--on-drift=" + policy + ", not failing)",
    );
    return 0;
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
