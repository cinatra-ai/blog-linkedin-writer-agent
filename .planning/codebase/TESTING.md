# Testing Patterns

**Analysis Date:** 2026-06-09

## Overview

This is a content-only Cinatra agent extension with no `src/` TypeScript sources. The only executable code is `extension-kind-gate.mjs` — a self-contained CI gate script. There are no test files present in this repository. Testing of the agent's LLM output behavior is handled by the parent cinatra monorepo.

## Test Framework

**Runner:** Not detected — no `jest.config.*`, `vitest.config.*`, or test runner dependency in `package.json`.

**Assertion Library:** Not detected.

**Run Commands:**
```bash
# CI runs (standalone repos only):
corepack pnpm test --if-present   # No-ops if no test script present

# This repo skips standalone tests because it declares host-internal
# @cinatra-ai/* optional peers — the monorepo owns test execution.
```

## Test File Organization

**Location:** No test files detected. The repo contains no `*.test.*` or `*.spec.*` files.

**Monorepo ownership:** Per `.github/workflows/ci.yml` lines 114-123, repos with host-internal `@cinatra-ai/*` optional peers skip standalone test execution. Tests for this agent's integration behavior run in the cinatra monorepo context.

## What Is Validated (CI Gate — Not Unit Tests)

The CI pipeline runs a structural validation gate instead of unit tests:

**Agent OAS gate** (`extension-kind-gate.mjs`):
- Parses `cinatra/oas.json` and confirms it is valid JSON
- Scans all LLM-visible OAS fields (`system`, `user`, `description`) for banned/retired CRM primitives
- Checks for banned type hints (`@cinatra-ai/entity-accounts:account`, `@cinatra-ai/entity-contacts:contact`)
- Checks for banned `objects_list` patterns over CRM entity types

**Package shape gate** (inline in CI):
- Confirms no first-party `@cinatra-ai/*` packages leaked into `dependencies`/`devDependencies`
- Confirms first-party peers are declared `peerDependenciesMeta.optional: true`

**Dry-run publish gate:**
```bash
npm pack --dry-run   # Validates package shape + publish payload
```

## Gate Script Design (extension-kind-gate.mjs)

The gate script exports pure functions, enabling future test coverage without mocking:

```js
// All exported — testable in isolation:
export function parseArgs(argv) { ... }
export function validateAgent(packageRoot) { ... }        // returns string[]
export function validateWorkflow(packageRoot) { ... }     // returns string[]
export function validateBpmnSanity(xml) { ... }           // returns string[]
export function validateWorkflowPackageShape(pkg) { ... } // returns string[]
export function findWorkflowSidecars(packageRoot) { ... } // returns string[]
export function runGate(packageRoot) { ... }              // returns { kind, errors }
```

The `main()` function is guarded behind an `invokedDirectly` check so the file can be imported by a test runner without side effects:
```js
const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname);
if (invokedDirectly) { main(); }
```

## Mocking

Not applicable — no test suite exists. If tests were added for `extension-kind-gate.mjs`, the pure-function design means no mocking is needed for logic paths; only file system calls (`readFileSync`, `existsSync`, `readdirSync`) would require either mocking or temp-dir fixtures.

## Fixtures and Factories

Not applicable — no test suite exists.

## Coverage

**Requirements:** None enforced (no coverage tooling configured).

## Test Types

**Unit Tests:** Not present.

**Integration Tests:** Not present.

**E2E Tests:** Not present.

**CI structural gates (effectively smoke tests):**
- Agent OAS gate: `node extension-kind-gate.mjs --package-root .` (run in `kind-gates` job, `.github/workflows/ci.yml` line 145)
- Workflow: `push` and `pull_request` on `main` branch

## SKILL.md Behavioral Contract (Not Tested Programmatically)

The agent's behavioral correctness is defined in `skills/blog-linkedin-writer-agent/SKILL.md` and enforced via the LLM at runtime:

- Required inputs: `postTitle`, `blogPostUrl` (missing either → degenerate output)
- Output shape: `{ "post": string, "notes": string }` — JSON only, no Markdown wrapping
- Voice rule: `destinationType === "member"` → first person; `"organization"` → brand/we voice
- URL constraint: `blogPostUrl` appears exactly once as the final line
- No tool calls, no web_search, no MCP primitives

Validation of this behavioral contract is manual or integration-tested within the cinatra platform.

---

*Testing analysis: 2026-06-09*
