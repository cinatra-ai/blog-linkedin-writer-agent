# External Integrations

**Analysis Date:** 2026-06-09

## APIs & External Services

**LLM Bridge (Cinatra Platform):**
- Cinatra `/api/llm-bridge` — the sole external call; submits a system + user prompt and receives a JSON `{post, notes}` response
  - Endpoint: `{{CINATRA_BASE_URL}}/api/llm-bridge` (POST)
  - Auth: platform-managed via `CINATRA_BASE_URL` runtime environment variable
  - Configured in: `cinatra/oas.json` under `$referenced_components.write`

**OpenAI:**
- Used as the preferred LLM provider behind the `/api/llm-bridge` call
  - Preferred model: `gpt-5.5`
  - Auth: managed by the Cinatra platform (not configured in this repo)
  - SDK/Client: not directly imported — all OpenAI interaction is proxied through Cinatra's LLM bridge

## Data Storage

**Databases:**
- Not applicable — stateless agent, no database reads or writes

**File Storage:**
- Not applicable

**Caching:**
- Not applicable

## Authentication & Identity

**Auth Provider:**
- Not applicable — authentication is handled entirely by the Cinatra platform host
- This agent has no auth logic of its own

## Monitoring & Observability

**Error Tracking:**
- Not detected — no error tracking SDK present

**Logs:**
- Not applicable — stateless LLM-only leaf; no logging infrastructure in this repo

## CI/CD & Deployment

**Hosting:**
- Cinatra platform marketplace (published as npm package `@cinatra-ai/blog-linkedin-writer-agent`)

**CI Pipeline:**
- GitHub Actions — two workflows present:
  - `.github/workflows/ci.yml` — build, typecheck, test, pack dry-run, plus OAS agent validation gate via `extension-kind-gate.mjs`
  - `.github/workflows/release.yml` — release workflow (not read in detail)

## Environment Configuration

**Required env vars:**
- `CINATRA_BASE_URL` — base URL for the Cinatra LLM bridge API call (runtime, injected by platform)

**Secrets location:**
- No `.env` file present; secrets are injected at runtime by the Cinatra platform

## Webhooks & Callbacks

**Incoming:**
- Not applicable — agent is invoked by the Cinatra flow engine, not via webhooks

**Outgoing:**
- Not applicable — all outbound communication is a single synchronous POST to `/api/llm-bridge`

---

*Integration audit: 2026-06-09*
