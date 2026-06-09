<!-- refreshed: 2026-06-09 -->
# Architecture

**Analysis Date:** 2026-06-09

## System Overview

```text
┌────────────────────────────────────────────────────────────────┐
│                        Caller / Orchestrator                   │
│        (cinatra platform, parent workflow, or direct API call) │
└─────────────────────────────┬──────────────────────────────────┘
                              │  inputs: postTitle, blogPostUrl,
                              │          companyUrl, postExcerpt,
                              │          blogPostContent,
                              │          destinationType,
                              │          destinationName,
                              │          cinatra_run_id
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    StartNode  (OAS: "start")                   │
│                  `cinatra/oas.json` — $referenced_components   │
│   Validates required fields: postTitle, blogPostUrl            │
│   Applies defaults to optional fields                          │
└─────────────────────────────┬──────────────────────────────────┘
                              │  DataFlowEdges (all inputs)
                              ▼
┌────────────────────────────────────────────────────────────────┐
│               ApiNode "write"  (OAS: "write")                  │
│      POST {{CINATRA_BASE_URL}}/api/llm-bridge                  │
│   - agent_id: "blog-linkedin-writer-agent"                     │
│   - system: inline system prompt                               │
│   - user: templated prompt with all inputs                     │
│   - SKILL.md auto-discovered by bridge from agent_id           │
│     `skills/blog-linkedin-writer-agent/SKILL.md`               │
│   - LLM: OpenAI gpt-5.5  (preferredProvider: openai)          │
│   - No MCP tool calls. No web_search. Pure LLM generation.     │
└─────────────────────────────┬──────────────────────────────────┘
                              │  outputs: post, notes
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    EndNode  (OAS: "end")                       │
│              Returns { post: string, notes: string }           │
└────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| OAS Flow definition | Declares the entire agent flow: nodes, control-flow, data-flow edges, I/O schema | `cinatra/oas.json` |
| StartNode ("start") | Validates required inputs (`postTitle`, `blogPostUrl`), applies defaults, passes all fields to the write node | `cinatra/oas.json` → `$referenced_components.start` |
| ApiNode ("write") | POSTs to `/api/llm-bridge` with system + user prompts; the bridge auto-discovers SKILL.md by `agent_id` | `cinatra/oas.json` → `$referenced_components.write` |
| EndNode ("end") | Surfaces `post` and `notes` as the flow's outputs | `cinatra/oas.json` → `$referenced_components.end` |
| SKILL.md | The LLM system prompt / behavioral spec auto-discovered by the llm-bridge from this agent's `agent_id` | `skills/blog-linkedin-writer-agent/SKILL.md` |
| extension-kind-gate | Self-contained CI validator: parses `cinatra/oas.json`, scans LLM-visible fields for banned/retired CRM primitives | `extension-kind-gate.mjs` |
| package manifest | Cinatra agent metadata (`kind: "agent"`, `dependencies: []`), NPM publish identity | `package.json` |

## Pattern Overview

**Overall:** Stateless Cinatra Leaf Agent (LLM-Only)

**Key Characteristics:**
- Single-step flow: StartNode → ApiNode → EndNode. No branching, no loops, no HITL.
- The ApiNode delegates to `/api/llm-bridge`, which resolves the SKILL.md system prompt by `agent_id`.
- No MCP tool calls, no `web_search`, no external API calls beyond the LLM bridge itself.
- Error handling is prompt-level: SKILL.md instructs the LLM to never throw and always return the JSON envelope.
- All business logic lives in `skills/blog-linkedin-writer-agent/SKILL.md` — the OAS flow is infrastructure.

## Layers

**OAS Flow Layer:**
- Purpose: Declares agent topology — inputs, outputs, node wiring, data-flow
- Location: `cinatra/oas.json`
- Contains: StartNode, ApiNode, EndNode, ControlFlowEdges, DataFlowEdges
- Depends on: `skills/blog-linkedin-writer-agent/SKILL.md` (discovered at runtime by the bridge)
- Used by: Cinatra platform at publish/run time

**Skill / Prompt Layer:**
- Purpose: Full behavioral specification for the LLM — parsing inputs, writing the post, error handling, output schema
- Location: `skills/blog-linkedin-writer-agent/SKILL.md`
- Contains: Step-by-step recipe, voice rules, error handling, JSON return shape
- Depends on: Nothing (pure markdown prompt)
- Used by: `/api/llm-bridge` (auto-discovery by `agent_id`)

**CI / Validation Layer:**
- Purpose: Pre-publish sanity gate — validates OAS parses, scans for retired CRM primitives
- Location: `extension-kind-gate.mjs`
- Contains: `validateAgent`, `runGate`, `validateBpmnSanity`, `validateWorkflow` (workflow gate also shipped)
- Depends on: Node.js builtins only (zero external dependencies by design)
- Used by: `.github/workflows/ci.yml` (kind-gates job)

## Data Flow

### Primary Request Path

1. Caller supplies inputs to the Cinatra platform flow runner (`cinatra/oas.json` — StartNode)
2. StartNode validates `postTitle` + `blogPostUrl` (required), applies defaults to optional fields
3. All inputs flow via DataFlowEdges to the ApiNode ("write")
4. ApiNode POSTs to `{{CINATRA_BASE_URL}}/api/llm-bridge` with `agent_id: "blog-linkedin-writer-agent"`, inline system prompt, and a templated user prompt containing all inputs
5. The bridge auto-discovers `skills/blog-linkedin-writer-agent/SKILL.md` and calls the LLM (OpenAI gpt-5.5)
6. LLM returns `{ "post": "...", "notes": "..." }` as a bare JSON object
7. ApiNode maps `post` and `notes` outputs via DataFlowEdges to the EndNode
8. Caller receives `{ post: string, notes: string }`

### Degenerate Input Path

1. If `postTitle` or `blogPostUrl` is missing/empty at the OAS layer, the StartNode's `metadata.cinatra.required` contract prevents the flow from proceeding
2. Defensively, SKILL.md instructs the LLM to return `{ "post": "", "notes": "postTitle_or_blogPostUrl_missing — cannot draft" }` if either field is empty

**State Management:**
- Stateless. No persistence, no session, no object store writes. Each invocation is fully independent.

## Key Abstractions

**SKILL.md Prompt Spec:**
- Purpose: The authoritative behavioral contract for the LLM — replaces code logic with structured markdown instructions
- Examples: `skills/blog-linkedin-writer-agent/SKILL.md`
- Pattern: Step-by-step recipe (Parse → Find angle → Write post → Write notes) with explicit error handling and output schema

**Cinatra OAS Flow:**
- Purpose: Declarative agent topology consumed by the Cinatra platform
- Examples: `cinatra/oas.json`
- Pattern: `agentspec_version 26.1.0`, `component_type: "Flow"`, nodes + control/data flow edges

**LLM Bridge Contract:**
- Purpose: The ApiNode posts to `/api/llm-bridge` with `agent_id`; the bridge resolves SKILL.md and calls the LLM
- Pattern: `agent_id` → auto-discovery of `skills/<agent_id>/SKILL.md`

## Entry Points

**Flow Invocation:**
- Location: `cinatra/oas.json` — StartNode (`$referenced_components.start`)
- Triggers: Cinatra platform flow runner (on workflow invocation or direct agent call)
- Responsibilities: Validates required inputs, applies defaults, initiates data flow

**CI Gate:**
- Location: `extension-kind-gate.mjs` (function `main`)
- Triggers: `node extension-kind-gate.mjs --package-root .` in `.github/workflows/ci.yml`
- Responsibilities: Parses OAS, scans LLM-visible fields for banned/retired primitives, exits 0/1

## Architectural Constraints

- **Threading:** Not applicable — stateless LLM call, no server process
- **Global state:** None. `extension-kind-gate.mjs` exports pure functions only; no module-level mutable state
- **Circular imports:** Not applicable — no application source code, no import graph
- **No MCP tools:** SKILL.md and the OAS `write` node metadata both explicitly forbid MCP/tool calls. The ApiNode intentionally omits `metadata.cinatra.toolboxes`
- **No HITL:** `hitlScreens: []` in `cinatra/oas.json` metadata — no human-in-the-loop steps
- **No first-party deps:** `package.json` declares `"dependencies": []`; no `@cinatra-ai/*` in deps/devDeps (enforced by CI classifier step)

## Anti-Patterns

### Calling MCP or web_search tools from this agent

**What happens:** The OAS `write` node and SKILL.md both forbid tool use. If a future edit adds `toolboxes` to the ApiNode metadata or references tools in the system prompt, the agent would attempt tool calls.
**Why it's wrong:** This is a pure LLM-only leaf agent. All required information is in the inputs. Adding tools introduces network dependencies, latency, and side effects incompatible with the stateless design.
**Do this instead:** Pass additional context as input fields. If tool access is needed, create a parent workflow that calls tools and passes results as `blogPostContent` or `postExcerpt`.

### Placing business logic in `cinatra/oas.json` prompt strings

**What happens:** The `write` node's `system` and `user` fields contain only a brief routing instruction. The full behavioral spec lives in SKILL.md.
**Why it's wrong:** Embedding detailed logic in OAS prompt strings makes it invisible to the SKILL.md auto-discovery mechanism and bypasses the banned-primitive gate's scan.
**Do this instead:** Keep OAS prompt strings minimal (routing intent only). Put all step-by-step logic, voice rules, and output schema in `skills/blog-linkedin-writer-agent/SKILL.md`.

## Error Handling

**Strategy:** Prompt-level graceful degradation — never throw, always return the JSON envelope.

**Patterns:**
- Degenerate input: `postTitle` or `blogPostUrl` missing → return `{ "post": "", "notes": "postTitle_or_blogPostUrl_missing — cannot draft" }`
- Missing optional fields: treat as `""` (postExcerpt, blogPostContent, companyUrl, destinationName) or `"organization"` (destinationType)
- All other errors: document in `notes`, write the best post possible from available information

## Cross-Cutting Concerns

**Logging:** Delegated to the Cinatra platform and `/api/llm-bridge` infrastructure. No application-level logging in this repo.
**Validation:** Input validation at two levels — OAS StartNode `metadata.cinatra.required` (platform-enforced) and defensive SKILL.md prompt instructions (LLM-enforced).
**Authentication:** Handled by the Cinatra platform. This repo has no auth code.

---

*Architecture analysis: 2026-06-09*
