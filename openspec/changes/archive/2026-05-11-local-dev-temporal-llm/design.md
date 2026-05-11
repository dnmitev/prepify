## Context

Prepify already ships Postgres via Compose and documents Temporal as optional (`temporal server start-dev`). Developers hit **`503`** on `/jobs/generate` when Temporal is absent, and testing **real** LLM JSON output requires keys unless a **local OpenAI-compatible** server is used.

## Goals / Non-Goals

**Goals:**

- One Compose stack that brings up **application Postgres + Temporal** for typical laptop workflows.
- Copy-paste **README + `.env.example`** guidance for **`TEMPORAL_ADDRESS`**, worker, API, and **local model** (Ollama-style) for generation smoke tests.
- Worker accepts **local OpenAI-compatible** endpoints without mandating cloud **`OPENAI_API_KEY`** when configured per documented rules.

**Non-Goals:**

- Production-grade Temporal HA topology or Kubernetes manifests.
- Bundling Ollama inside this repo’s Compose (document install/run separately or optional profile).
- Changing AWS exam semantics or scoring.

## Decisions

### D1 — Temporal via Docker Compose

**Choice:** Add official **`temporalio/auto-setup`** (or current recommended image tag) plus a **dedicated Postgres instance for Temporal persistence** (separate from `prepify` app DB) to avoid schema collisions and match upstream samples.

**Alternatives:** Only document `temporal server start-dev` — lighter but diverges from “Compose has Temporal”; merge Temporal DB into app Postgres — possible but higher coupling and migration risk.

### D2 — Temporal Web UI (optional)

**Choice:** Expose **Temporal Web** on a documented host port when low-cost (depends on image/support). If the chosen stack bundles UI separately, add **`temporal-ui`** service from Temporal docs; otherwise document linking to CLI/Web via port-forward patterns.

**Alternatives:** Skip UI — acceptable but slower debugging.

### D3 — Local LLM wiring

**Choice:** Continue using existing **`OPENAI_BASE_URL`** + OpenAI SDK-compatible **`fetch`** path in worker; document **Ollama** (`http://localhost:11434/v1`) with an example model name. Treat missing **`OPENAI_API_KEY`** as acceptable when **`OPENAI_API_KEY`** is empty **and** base URL host is loopback or **`LOCAL_LLM_SKIP_API_KEY=1`** (pick one explicit rule in implementation).

**Alternatives:** New provider enum `ollama` — more code paths; rejected unless OpenAI-compatible path proves insufficient.

## Risks / Trade-offs

- **Image churn** — Temporal images/tags update frequently → Mitigation: pin a tested minor tag in Compose; document bump process.
- **Resource usage** — Temporal + Postgres doubles footprint → Mitigation: document memory expectations; keep `temporal server start-dev` as lighter alternative in README.
- **Local LLM quality** — Small models may emit invalid JSON → Mitigation: unchanged schema validation; README notes model size hints.

## Migration Plan

1. Land Compose + docs first (no breaking changes to prod paths).
2. Adjust worker key validation behind documented env rules.
3. Verify `docker compose up`, worker connects, `/jobs/generate` returns **200** with mock provider; optional manual smoke with Ollama.

## Open Questions

- Exact Temporal Compose snippet version-pin vs `latest` (resolve during implementation against CI/developer laptops).
