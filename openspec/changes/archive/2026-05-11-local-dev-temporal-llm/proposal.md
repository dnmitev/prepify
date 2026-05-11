## Why

Local developers need **Temporal** running beside Postgres so `/jobs/generate` and the worker can be exercised without manual installation surprises. They also need a **repeatable way to test AI question generation** without cloud API keys—typically an **OpenAI-compatible local endpoint** (for example **Ollama**) wired through existing env-based role configuration.

## What Changes

- Extend **Docker Compose** so the default local stack includes **Temporal** (cluster/server reachable from the host on the documented port, worker-compatible).
- Document **environment variables** and **startup order** for API + worker + Temporal + Postgres (+ optional local LLM).
- Optionally expose **Temporal Web UI** on a host port for debugging workflows.
- Clarify **local LLM** usage for question generation: `OPENAI_BASE_URL` pointing at an OpenAI-compatible local server, model selection via existing `LLM_ROLE_*` vars, and relaxed or documented API-key behavior for local-only backends.
- Update **README** (and `.env.example`) so “full local AI stack” is copy-pasteable.

## Capabilities

### New Capabilities

- `local-dev-runtime`: Docker Compose services, ports, and documentation so Postgres **and Temporal** start together for local development; includes operational notes (health checks, typical `TEMPORAL_ADDRESS`).

### Modified Capabilities

- `ai-orchestration`: Add explicit requirements for **local / OpenAI-compatible** backends used in development (including optional API key when the server does not require one, e.g. Ollama), and document how generation roles map to a local model for testing.

## Impact

- `docker-compose.yml` (new Temporal-related services; may add a Temporal-specific DB or shared Postgres pattern per Temporal’s supported topology).
- `README.md`, `.env.example`, possibly root `Dockerfile` comments.
- `apps/worker` LLM call path: allow documented local OpenAI-compatible usage without blocking on missing cloud keys when configured for local base URL.
- Optional: small smoke script or `package.json` script for “local stack up”.
- CI: unchanged unless we add a compose smoke job (out of scope unless tasks demand it).
