# Technology Stack

**Analysis Date:** 2026-06-09

## Languages

**Primary:**
- JSON — agent flow specification and OAS definition (`cinatra/oas.json`)
- Markdown — system prompt / skill definition (`skills/blog-linkedin-writer-agent/SKILL.md`)

**Secondary:**
- JavaScript (ESM) — CI gate tooling (`extension-kind-gate.mjs`), zero-dependency, Node builtins only
- TypeScript — configured but no `src/` files tracked in this extracted mirror repo (`tsconfig.json` targets `src/`)

## Runtime

**Environment:**
- Node.js 24 (specified in `.github/workflows/ci.yml` via `actions/setup-node@v4`)

**Package Manager:**
- pnpm (via corepack) — used in CI steps
- No lockfile committed (CI runs `--no-frozen-lockfile`)

## Frameworks

**Core:**
- Cinatra Agent Framework (agentspec_version `26.1.0`) — declarative agent/flow definition via `cinatra/oas.json`

**Testing:**
- Not applicable — this is a source mirror repo; tests run in the cinatra monorepo

**Build/Dev:**
- No build step required — content-only extension (no tracked TypeScript sources)
- `extension-kind-gate.mjs` — self-contained CI validation script, no external dependencies

## Key Dependencies

**Critical:**
- None declared in `package.json` `dependencies` or `devDependencies` — this is a content-only extension package
- No `node_modules` or lockfile present

**Infrastructure:**
- OpenAI GPT (via Cinatra LLM bridge) — preferred provider `openai`, preferred model `gpt-5.5`, configured in `cinatra/oas.json` under `metadata.cinatra.llm`

## Configuration

**Environment:**
- `CINATRA_BASE_URL` — runtime environment variable used as the base URL for the `/api/llm-bridge` ApiNode call (templated in `cinatra/oas.json` as `{{CINATRA_BASE_URL}}`)
- `.env` file: not present in repo

**Build:**
- `tsconfig.json` — standalone strict TypeScript config targeting `src/` (ES2023, ESNext modules, bundler resolution); no `src/` files exist in this extracted mirror
- `.npmrc` — sets `auto-install-peers=false`
- `package.json` — declares `cinatra.apiVersion: cinatra.ai/v1`, `cinatra.kind: agent`, `cinatra.dependencies: []`

## Platform Requirements

**Development:**
- Node.js 24+, corepack/pnpm for CI validation
- Access to Cinatra monorepo for full typecheck and test runs (this mirror is not standalone-installable)

**Production:**
- Deployed and executed by the Cinatra platform
- LLM calls routed through `{CINATRA_BASE_URL}/api/llm-bridge` POST endpoint
- No HITL screens, no MCP tool calls — pure LLM generation leaf agent

---

*Stack analysis: 2026-06-09*
