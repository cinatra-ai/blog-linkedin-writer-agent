# Blog LinkedIn Writer Agent

Turn a published blog post into a short, native-feeling LinkedIn promotional post. Give the agent the blog title, excerpt, body, and the company behind it, and it writes a concise LinkedIn post tuned to whether you are posting as a person or a company page — ready to drop into your scheduler or hand to the LinkedIn publish agent.

**Install.** Add this agent as a dependency in your Cinatra workspace via the marketplace, or declare it in your workflow's extension dependencies.

**Usage.** Invoke the agent with `postTitle` and `blogPostUrl` (both required). Optionally supply `postExcerpt`, `blogPostContent`, `companyUrl`, `destinationType` (`"member"` or `"organization"`, default `"organization"`), and `destinationName`. The agent returns `{ post, notes }`: `post` is the finished LinkedIn copy; `notes` is a one- or two-sentence operator summary of the angle taken.

**Configuration.** No secrets or credentials are required. The agent uses the Cinatra LLM bridge (`/api/llm-bridge`) and auto-discovers its system prompt via `agent_id`. Set `CINATRA_BASE_URL` in your environment to point to your Cinatra instance.

**Development.** Run `node extension-kind-gate.mjs --package-root .` to validate the extension before publishing. No build step is needed for the prompt; `cinatra/oas.json` defines the flow graph.

**API contract.** Inputs: `postTitle: string` (required), `blogPostUrl: string` (required), `companyUrl: string` (optional), `postExcerpt: string` (optional), `blogPostContent: string` (optional), `destinationType: "member" | "organization"` (optional, default `"organization"`), `destinationName: string` (optional). Outputs: `post: string`, `notes: string`. On missing required fields the agent returns `post: ""` with a descriptive `notes` value rather than throwing.

**Troubleshooting.** If `post` is empty, check that `postTitle` and `blogPostUrl` are non-empty strings. If the copy reads as organization voice when you expected first-person, confirm `destinationType` is `"member"`. This is a stateless, LLM-only leaf agent: no MCP tool calls, no web requests beyond the LLM bridge.

## Works with

- Cinatra blog content workflows

## Capabilities

- Write a short LinkedIn promotional post from a published blog article
- Tune the voice for a member profile or a company page
- Lead with a hook that earns the click back to the full post
- Return clean copy that is ready to paste, schedule, or publish
