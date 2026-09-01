// Pins that the LinkedIn writer's post lands as a LINKEDIN post draft. Before
// this conversion the pack declared no production at all and its `post` output
// was unbound, so the pipeline filed the LinkedIn copy as a second blog post.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const oas = JSON.parse(readFileSync(join(root, "cinatra", "oas.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const end = oas.$referenced_components.end;
const post = end.outputs.find((o) => o.title === "post");

test("the post output is bound to the LinkedIn post-draft type", () => {
  assert.deepEqual(post.cinatra.artifact, {
    extension: "@cinatra-ai/linkedin-artifacts",
    objectTypeId: "@cinatra-ai/linkedin:post-draft",
    contentFrom: "post",
    declaredMime: "text/plain",
    titleFrom: "title",
  });
});

test("the binding has a title to read — the writer emits one", () => {
  const titles = end.outputs.map((o) => o.title);
  assert.ok(titles.includes("title"), "the end node must carry the bound title output");
  assert.ok(
    oas.$referenced_components.write.outputs.some((o) => o.title === "title"),
    "the title must be sourced from the writing node, never invented by the host",
  );
  assert.ok(
    oas.data_flow_connections.some(
      (e) => e.source_output === "title" && e.destination_input === "title",
    ),
    "the title output must be edge-sourced into the end node",
  );
});

test("the produces entry names the LinkedIn type, not the blog post", () => {
  assert.deepEqual(manifest.cinatra.produces, [
    {
      extension: "@cinatra-ai/linkedin-artifacts",
      objectTypeId: "@cinatra-ai/linkedin:post-draft",
    },
  ]);
});

test("both dependency edges are declared — what it writes and what it reads", () => {
  const names = (manifest.cinatra.dependencies || [])
    .filter((d) => d.kind === "artifact")
    .map((d) => d.packageName)
    .sort();
  assert.deepEqual(names, [
    "@cinatra-ai/blog-post-artifact",
    "@cinatra-ai/linkedin-artifacts",
  ]);
});

test("the prompt names the three declared keys", () => {
  const system = oas.$referenced_components.write.data.system;
  for (const key of ["post", "title", "notes"]) {
    assert.ok(system.includes(`\`${key}\``), `the prompt must name the declared output ${key}`);
  }
});
