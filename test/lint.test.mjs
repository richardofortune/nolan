/**
 * The craft floor has to cover every place words reach the screen. It used to
 * cover only `say`, so a tell inside a rail label or a title card shipped clean
 * — which is worse than a bad caption, because the rail is on screen the whole
 * film. These tests pin each surface open.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { lintScreenplay } from "../src/lint.mjs";

const rules = (findings) => findings.map((f) => f.rule);
const scene = (...beats) => ({ scenes: [{ id: "s1", beats }] });

test("a caption is still linted", () => {
  const f = lintScreenplay(scene({ do: "say", text: "This — is the tell." }));
  assert.ok(rules(f).includes("em-dash"));
});

test("a top-level rail label is linted", () => {
  const f = lintScreenplay({ steps: ["Open the app — then sign in"], scenes: [] });
  assert.ok(rules(f).includes("em-dash"), "em-dash in a step label must be an error");
});

test("a rail label finding says which step it came from", () => {
  const f = lintScreenplay({ steps: ["Fine", "Leverage the thing"], scenes: [] });
  const hit = f.find((x) => x.rule === "ai-word");
  assert.ok(hit, "AI-flavoured word in a step label must be reported");
  assert.match(hit.msg, /^step 2:/, "the message must name the step, since it has no scene");
});

test("a title card line is linted", () => {
  const f = lintScreenplay(scene({ do: "card", lines: [{ text: "A robust — tapestry" }] }));
  assert.ok(rules(f).includes("em-dash"));
  assert.ok(rules(f).includes("ai-word"));
});

test("a rail label carried on the beat is linted", () => {
  const f = lintScreenplay(scene({ do: "step", text: "Click the — button" }));
  assert.ok(rules(f).includes("em-dash"));
});

test("clean copy on every surface stays clean", () => {
  const f = lintScreenplay({
    steps: ["Search Google", "Open your card"],
    scenes: [{ id: "s1", beats: [
      { do: "card", lines: [{ text: "Who owes what, after the trip." }] },
      { do: "step", n: 1 },
      { do: "say", text: "Type the name you want." },
    ] }],
  });
  assert.deepEqual(f, [], "no findings expected");
});

test("a card with no lines, and a step with no text, do not throw", () => {
  assert.deepEqual(lintScreenplay(scene({ do: "card" }, { do: "step", n: 2 })), []);
});
