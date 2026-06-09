# Coding Conventions

**Analysis Date:** 2026-06-09

## Repository Type

This is a content-only Cinatra agent extension. It ships no `src/` TypeScript sources — the repository consists of a declarative agent manifest (`cinatra/oas.json`), a SKILL.md prompt file, and a self-contained CI gate script (`extension-kind-gate.mjs`). Conventions below reflect the actual artifacts in this repo.

## Naming Patterns

**Files:**
- `kebab-case` for all files: `oas.json`, `extension-kind-gate.mjs`, `SKILL.md`
- UPPERCASE.md for documentation files: `SKILL.md`, `README.md`, `LICENSE`
- `extension-kind-gate.mjs` uses `.mjs` extension indicating ESM module format

**OAS/Manifest identifiers:**
- `camelCase` for input/output field names: `postTitle`, `blogPostUrl`, `companyUrl`, `postExcerpt`, `blogPostContent`, `destinationType`, `destinationName`, `cinatra_run_id` (snake_case for system-injected fields)
- `kebab-case` for node IDs: `blog-linkedin-writer-agent-flow`, `start`, `write`, `end`
- `snake_case` for data flow connection names: `start_postTitle_to_write_postTitle`

**Package:**
- `@cinatra-ai/<slug>` scoped package naming pattern (e.g., `@cinatra-ai/blog-linkedin-writer-agent`)
- Agent slugs use `kebab-case` throughout

**JavaScript functions (in `extension-kind-gate.mjs`):**
- `camelCase` for all exported and local functions: `parseArgs`, `validateAgent`, `validateWorkflow`, `validateBpmnSanity`, `walkLlmStrings`, `findWorkflowSidecars`, `runGate`
- `SCREAMING_SNAKE_CASE` for module-level constants: `LLM_VISIBLE_FIELDS`, `BANNED_PRIMITIVES`, `BANNED_TYPEHINTS`, `BPMN_MODEL_NS`, `WORKFLOW_PACKAGE_NAME_RE`

## Code Style (extension-kind-gate.mjs)

**Formatting:**
- 2-space indentation throughout
- Double quotes for strings
- Semicolons at end of statements
- Arrow functions for callbacks
- Trailing commas in multiline arrays/objects

**Linting:**
- No linting config detected (`.eslintrc*`, `biome.json` absent). The script is self-contained and zero-dependency by design.

**Module System:**
- ESM (`"type": "module"` in `package.json`)
- Named exports for all public functions (`export function`)
- Guarded main invocation via `invokedDirectly` check — allows both direct CLI use and `import` by test files:
  ```js
  const invokedDirectly =
    process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname);
  if (invokedDirectly) { main(); }
  ```

## Import Organization

**Order (in `extension-kind-gate.mjs`):**
1. Node built-in modules only (`node:fs`, `node:path`) — no third-party imports

**Path style:**
- `node:` protocol prefix for built-ins: `import { readFileSync } from "node:fs"`

## Error Handling

**Strategy:** Functions return `string[]` error arrays rather than throwing. The `runGate` entry point uses try/catch for JSON parsing and surfaces errors as array entries.

**Patterns:**
- Pure functions that return `string[]` errors: `validateAgent`, `validateWorkflow`, `validateBpmnSanity`, `validateWorkflowPackageShape`
- Try/catch used only at I/O boundaries (file read, JSON parse)
- Early returns on fatal errors (e.g., parse failure returns immediately without further validation)
- `main()` itself is wrapped in try/catch with `process.exit(1)` on unexpected error

**SKILL.md error handling contract:**
- Agent MUST never throw — always returns the JSON envelope
- Degenerate input branch returns `{ "post": "", "notes": "postTitle_or_blogPostUrl_missing — cannot draft" }`
- Missing optional fields default to `""` rather than erroring

## Logging

**Framework:** `console.log` / `console.error` (Node built-ins only)

**Patterns:**
- Success: `console.log("✓ extension-kind-gate: ...")` to stdout
- Failure: `console.error("✗ extension-kind-gate: ...")` to stderr with bulleted violation list

## Comments

**Usage:**
- Block comments at file top describe purpose, scope, usage, and exit codes
- Inline `//` comments explain non-obvious decisions (e.g., why `npx` vs `pnpm dlx`, why `--no-frozen-lockfile`)
- JSDoc-style `/** */` on exported functions with Pure notation: `/** Validate an agent extension at packageRoot. Pure: returns string[] errors. */`

## OAS/Manifest Conventions

**`cinatra/oas.json`:**
- All nodes declare explicit `inputs` and `outputs` arrays with `{ title, type }` objects
- `default` values declared inline on optional inputs
- `metadata.cinatra` block carries operational metadata: `riskClass`, `requiresApproval`, `packageName`
- `$component_ref` strings used for node cross-references within `$referenced_components`
- Data flow connection names follow pattern `<source>_<field>_to_<dest>_<field>`

**`package.json`:**
- `cinatra` block with `apiVersion`, `kind`, `dependencies` keys
- No `scripts` block — this is a content-only extension
- `"type": "module"` to match the `.mjs` gate script

---

*Convention analysis: 2026-06-09*
