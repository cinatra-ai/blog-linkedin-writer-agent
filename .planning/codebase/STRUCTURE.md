# Codebase Structure

**Analysis Date:** 2026-06-09

## Directory Layout

```
blog-linkedin-writer-agent/          # Repo root — extracted Cinatra agent package
├── cinatra/                         # Cinatra platform artifacts
│   └── oas.json                     # Agent flow definition (OAS agentspec v26.1.0)
├── skills/                          # Agent skill/prompt directory
│   └── blog-linkedin-writer-agent/  # Skill subdirectory named by agent_id
│       └── SKILL.md                 # LLM behavioral spec, auto-discovered by bridge
├── .github/                         # CI/CD configuration
│   └── workflows/
│       ├── ci.yml                   # Main CI: classify, install, typecheck, test, pack, kind-gate
│       └── release.yml              # Release pipeline
├── .planning/                       # GSD planning documents (generated, committed)
│   └── codebase/                    # Codebase map documents
├── extension-kind-gate.mjs          # Self-contained CI validation gate (ESM, zero deps)
├── package.json                     # NPM manifest + cinatra agent metadata
├── tsconfig.json                    # TypeScript config (targets src/ — no src/ exists yet)
├── .npmrc                           # NPM registry configuration
├── LICENSE                          # Apache-2.0
└── README.md                        # Project documentation
```

## Directory Purposes

**`cinatra/`:**
- Purpose: Platform artifacts consumed by the Cinatra marketplace and flow runner
- Contains: `oas.json` — the complete agent flow definition (nodes, edges, I/O schema, LLM preferences)
- Key files: `cinatra/oas.json`

**`skills/blog-linkedin-writer-agent/`:**
- Purpose: Houses the SKILL.md prompt spec for this agent, auto-discovered at runtime by the llm-bridge using `agent_id`
- Contains: `SKILL.md` — full step-by-step behavioral specification for the LLM
- Key files: `skills/blog-linkedin-writer-agent/SKILL.md`

**`.github/workflows/`:**
- Purpose: CI/CD automation
- Contains: `ci.yml` (build, typecheck, test, pack dry-run, OAS kind-gate), `release.yml`
- Key files: `.github/workflows/ci.yml`

**`.planning/codebase/`:**
- Purpose: GSD codebase map documents (this directory)
- Generated: Yes (by GSD mapper)
- Committed: Yes

## Key File Locations

**Entry Points:**
- `cinatra/oas.json`: Agent flow definition — the platform entry point; StartNode declares required/optional inputs
- `extension-kind-gate.mjs`: CI entry point (`main()` function); also exports pure validation functions

**Configuration:**
- `package.json`: Package identity (`@cinatra-ai/blog-linkedin-writer-agent`), cinatra metadata (`kind: "agent"`, `dependencies: []`), license
- `tsconfig.json`: TypeScript compiler config — `rootDir: "src"`, `outDir: "dist"`, strict mode, ESNext modules
- `.npmrc`: NPM registry settings (existence noted; contents not read)

**Core Logic:**
- `skills/blog-linkedin-writer-agent/SKILL.md`: All agent behavior — input parsing, angle selection, post writing rules, voice tuning, error handling, return shape
- `cinatra/oas.json`: Data flow wiring; the `write` ApiNode's `system`/`user` prompt strings contain routing instructions

**Testing / Validation:**
- `extension-kind-gate.mjs`: Exports `validateAgent`, `validateWorkflow`, `validateBpmnSanity`, `validateWorkflowPackageShape`, `findWorkflowSidecars`, `runGate` — all pure functions, testable without a running platform

## Naming Conventions

**Files:**
- Cinatra platform artifacts: lowercase with hyphens, in `cinatra/` — e.g., `cinatra/oas.json`
- Skill files: always named `SKILL.md` (uppercase), nested under `skills/<agent-id>/`
- Gate scripts: `extension-kind-gate.mjs` (kebab-case, `.mjs` for native ESM)
- CI workflows: kebab-case `.yml` under `.github/workflows/`

**Directories:**
- Skill directory MUST match the `agent_id` used in the OAS `write` node's `data.agent_id` field — e.g., `skills/blog-linkedin-writer-agent/` matches `agent_id: "blog-linkedin-writer-agent"`
- Package name pattern: `@cinatra-ai/<slug>` where `<slug>` ends in `-agent` for agent extensions

## Where to Add New Code

**New agent behavior / prompt changes:**
- Edit: `skills/blog-linkedin-writer-agent/SKILL.md`
- No code changes required — the bridge auto-discovers and injects the updated SKILL.md

**New input fields:**
- Add to `cinatra/oas.json` in: `inputs[]` (top-level), `$referenced_components.start.inputs[]`, `$referenced_components.write.inputs[]`
- Add a DataFlowEdge from `start` to `write`
- Update the `user` prompt template in `$referenced_components.write.data.user`
- Update SKILL.md Inputs section to document the new field

**New output fields:**
- Add to `cinatra/oas.json` in: `outputs[]` (top-level), `$referenced_components.write.outputs[]`, `$referenced_components.end.outputs[]`
- Add a DataFlowEdge from `write` to `end`
- Update SKILL.md Return shape section

**TypeScript source code (if added):**
- Location: `src/` (per `tsconfig.json` `rootDir`)
- Compiled output: `dist/` (excluded from source control)
- Currently: no `src/` directory exists — this is a content-only agent extension

**CI gate additions:**
- Edit: `extension-kind-gate.mjs` for new validation logic
- Edit: `.github/workflows/ci.yml` for new CI steps

## Special Directories

**`cinatra/`:**
- Purpose: Required by Cinatra platform — agent OAS must live at exactly `cinatra/oas.json`
- Generated: No (hand-authored / tooling-generated, committed)
- Committed: Yes

**`skills/`:**
- Purpose: Skill prompt specs auto-discovered by the llm-bridge. Directory name is the `agent_id`
- Generated: No (authored)
- Committed: Yes

**`.planning/`:**
- Purpose: GSD planning and codebase map documents
- Generated: Yes (by GSD commands)
- Committed: Yes

**`dist/`:**
- Purpose: TypeScript compiled output (referenced in tsconfig but no `src/` exists today)
- Generated: Yes
- Committed: No (not present)

---

*Structure analysis: 2026-06-09*
