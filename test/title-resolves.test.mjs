// The binding names `title` as the output the artifact is filed under, so a run
// that returns no title files no artifact at all: the materializer refuses a
// titleFrom output that does not resolve to a non-empty string and the whole
// run lands failed after the model has already done its work.
//
// Declaring the output is therefore only half of it. The prompt has to make the
// model actually emit one, and a model copies the envelope it is shown — the
// normative "Return shape" block and the degenerate-input block — not the prose
// around them. So every envelope must carry all three declared keys.
//
// The blank title is the ONLY fail-closed lever on this path: the host checks
// that the title output is a non-empty string, but accepts ANY string as the
// content, the empty one included. So an envelope that names a post it did not
// write must hand back a BLANK title, or a run that drafted nothing files an
// empty post as a real draft. The writing envelope must be non-blank; the
// degenerate branch must be blank. Both directions are asserted below.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const oas = JSON.parse(readFileSync(join(root, "cinatra", "oas.json"), "utf8"));

const end = oas.$referenced_components.end;
const system = oas.$referenced_components.write.data.system;

/** Every fenced JSON envelope the prompt tells the model to return. */
const envelopes = [...system.matchAll(/```json\n([\s\S]*?)```/g)].map((m) => m[1]);

/** The output the end node names as the artifact title source. */
const titleFrom = end.outputs.find((o) => o.title === "post").cinatra.artifact.titleFrom;

test("the prompt shows at least the two envelopes it is meant to show", () => {
  assert.ok(envelopes.length >= 2, "expected the degenerate branch and the return shape");
});

test("every returned envelope carries the output the binding files the artifact under", () => {
  for (const [i, blk] of envelopes.entries()) {
    assert.match(
      blk,
      new RegExp(`"${titleFrom}"\\s*:`),
      `envelope ${i} omits "${titleFrom}" — a model copies the envelope, so the run returns no title and materialization fails`,
    );
  }
});

test("every envelope carries a string title, and the writing envelope a non-blank one", () => {
  for (const [i, blk] of envelopes.entries()) {
    const parsed = JSON.parse(blk);
    assert.equal(typeof parsed[titleFrom], "string", `envelope ${i} must carry a string ${titleFrom}`);
  }
  const writing = envelopes.filter((b) => !b.includes("cannot draft"));
  assert.ok(writing.length >= 1, "the normative return-shape envelope must be documented");
  for (const [i, blk] of writing.entries()) {
    assert.notEqual(
      JSON.parse(blk)[titleFrom].trim(),
      "",
      `writing envelope ${i} hands back a blank ${titleFrom}; the materializer refuses it and the drafted post is lost`,
    );
  }
});

test("the degenerate-input branch hands back a blank title so nothing is filed", () => {
  const degenerate = envelopes.find((b) => b.includes("cannot draft"));
  assert.ok(degenerate, "the degenerate-input branch must still be documented");
  const parsed = JSON.parse(degenerate);
  assert.equal(
    parsed[titleFrom],
    "",
    "a branch that returns an empty post must not name it: the host accepts an empty " +
      "content string, so a placeholder title would file an empty post as a real draft",
  );
  assert.equal(parsed.post, "", "the degenerate branch returns no post");
});

test("the prompt says why the degenerate title is blank on purpose", () => {
  assert.match(
    system,
    /do NOT put\s+a placeholder name here/,
    "without the reason stated in the prompt, the next edit reinstates the placeholder",
  );
});
