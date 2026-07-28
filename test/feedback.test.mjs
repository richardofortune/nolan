/**
 * `nolan feedback` builds a prefilled GitHub issue URL. The build is pure, so
 * it is tested without a browser: parse the URL back and assert on the params.
 *
 * The privacy cases are the load-bearing ones — the default body must carry
 * nothing about the user's app.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { buildFeedbackUrl, redactPaths } from "../src/feedback.mjs";

const META = { nolan: "0.1.0", node: "v20.11.0", platform: "darwin", arch: "arm64" };

/** Pull a query param back out of a built URL. */
const param = (url, name) => new URL(url).searchParams.get(name);
const bodyOf = (url) => param(url, "body");

test("body carries the message and the metadata footer", () => {
  const url = buildFeedbackUrl({
    message: "Restyle can't move the caption to the top — only the colour changes.",
    meta: META,
  });
  const body = bodyOf(url);
  assert.match(body, /Restyle can't move the caption to the top/);
  assert.match(body, /nolan 0\.1\.0 · node v20\.11\.0 · darwin arm64 · filed with `nolan feedback`/);
});

test("it files against the repo's issue tracker under the feedback label", () => {
  const url = buildFeedbackUrl({ message: "hello", meta: META });
  const parsed = new URL(url);
  assert.equal(parsed.origin + parsed.pathname, "https://github.com/richardofortune/nolan/issues/new");
  assert.equal(param(url, "labels"), "feedback");
});

test("the default body leaks nothing about the user's app", () => {
  // Asserted whole, not by pattern: the guarantee is that the body is *only*
  // the typed sentence and the four declared version fields. Any new field —
  // cwd, screenplay path, env — fails this.
  const message = "restyle can't reposition captions";
  const url = buildFeedbackUrl({ message, meta: META });
  assert.equal(
    bodyOf(url),
    `${message}\n\n---\n<sub>nolan 0.1.0 · node v20.11.0 · darwin arm64 · filed with \`nolan feedback\`</sub>`,
  );
});

test("a short message becomes the title untouched", () => {
  const url = buildFeedbackUrl({ message: "lint is wrong about hedging", meta: META });
  assert.equal(param(url, "title"), "lint is wrong about hedging");
});

test("a long message is truncated to 70 characters with an ellipsis", () => {
  const long = "x".repeat(200);
  const title = param(buildFeedbackUrl({ message: long, meta: META }), "title");
  assert.equal(title.length, 70);
  assert.ok(title.endsWith("…"), `expected an ellipsis, got ${JSON.stringify(title.slice(-5))}`);
});

test("--with-context appears in a fenced block labelled with the basename", () => {
  const url = buildFeedbackUrl({
    message: "verify: targets stopped resolving",
    context: { name: "demo.screenplay.json", text: '{"scenes":[]}' },
    meta: META,
  });
  const body = bodyOf(url);
  assert.match(body, /demo\.screenplay\.json/);
  assert.match(body, /```json\n\{"scenes":\[\]\}\n```/);
  // The footer still comes last.
  assert.ok(body.indexOf("```") < body.indexOf("<sub>"), "context sits above the metadata footer");
});

test("context over 4000 characters is truncated with a marker", () => {
  const url = buildFeedbackUrl({
    message: "big one",
    context: { name: "huge.json", text: "y".repeat(5000) },
    meta: META,
  });
  const body = bodyOf(url);
  assert.match(body, /…\(truncated\)/);
  assert.ok(body.length < 5000, "the 5000-char context did not survive whole");
});

test("an oversized total drops context and says to attach the file by hand", () => {
  const url = buildFeedbackUrl({
    message: "z".repeat(6000), // encoding inflates this past the URL ceiling on its own
    context: { name: "demo.screenplay.json", text: "some context" },
    meta: META,
  });
  const body = bodyOf(url);
  assert.doesNotMatch(body, /```/, "context block dropped");
  assert.match(body, /attach/i);
  assert.match(body, /demo\.screenplay\.json/, "still names the file to attach");
});

// The friction footers pre-write a summary from whatever nolan just printed,
// and node's own errors carry absolute paths ("ENOENT … open '/Users/nan/app'").
// Left alone, the suggested command would file the user's directory tree.

test("a pre-written summary is stripped of the working directory", () => {
  const raw = `ENOENT: no such file or directory, open '${process.cwd()}/nope.screenplay.json'`;
  assert.equal(redactPaths(raw), "ENOENT: no such file or directory, open 'nope.screenplay.json'");
});

test("a pre-written summary keeps home paths outside the project as ~", () => {
  const home = process.env.HOME;
  assert.equal(redactPaths(`cannot read ${home}/Secrets/app.json`), "cannot read ~/Secrets/app.json");
});

test("a summary with no paths in it is left alone", () => {
  const clean = "verify: targets stopped resolving in demo.screenplay.json";
  assert.equal(redactPaths(clean), clean);
});

test("special characters survive the round trip", () => {
  const message = "restyle & lint #12 broke\non the second line — 🎬 100% reproducible";
  const url = buildFeedbackUrl({ message, meta: META });
  assert.equal(bodyOf(url).split("\n\n---")[0], message);
});
