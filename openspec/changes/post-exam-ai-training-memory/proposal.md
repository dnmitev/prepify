## Why

Learners who miss exam items need **structured follow-up**: short, accurate remediation tied to what they got wrong, without paying for full LLM context on every future interaction. Today there is no durable **post-attempt training artifact** or **retrievable memory** that grows with practice, so the product cannot amortize coaching cost or personalize downstream AI help.

## What Changes

- After an attempt is **finalized** (submitted or expired), when there is **at least one incorrect scored response**, enqueue a **Temporal workflow** that builds **English-only** training content from those failures.
- Pipeline uses a **small / cheap model role** to **summarize each failure** (stem, chosen vs correct reasoning at a high level), then a **larger model role** to produce **teaching feedback** and **targeted knowledge** the learner can study.
- Persist training outputs and embeddings in **PostgreSQL** with **`pgvector`** so future LLM calls can **retrieve relevant past mistakes** (RAG-style memory) and reduce redundant generation.
- **Local development**: embedding and optional chat models run via **Docker Compose** (documented ports, no cloud keys required for the embedding path when using local inference).
- **Remote / production**: embedding uses a **documented cheap, reliable** provider or managed embedding API; chat roles follow existing **multi-role** configuration (secrets via env).

## Capabilities

### New Capabilities

- `post-exam-learning-memory`: Durable post-attempt training workflow, persistence of per-failure summaries and teaching notes, vector index and retrieval API contracts, English-only content, correlation to attempts and users.

### Modified Capabilities

- `practice-session`: When an attempt completes with incorrect scored items, the system SHALL reliably **signal or start** post-exam training orchestration (async, non-blocking for the exam UI).
- `ai-orchestration`: Named roles and/or configuration for **failure summarization**, **teaching feedback**, and **embedding** generation; token usage captured per activity; Temporal workflow for this feature follows existing retry/idempotency patterns.
- `local-dev-runtime`: Docker Compose includes **embedding (and optionally small LLM) services** aligned with local dev docs and env templates.

## Impact

- **Database**: new tables or columns, **`pgvector`** extension migration, indexing strategy for embeddings.
- **Worker (`apps/worker`)**: new Temporal workflow + activities; calls to embedding and chat providers.
- **API (`apps/api`)**: optional endpoints to read training status/results for an attempt; hooks on attempt finalization.
- **Web (`apps/web`)**: optional UI to view generated training after results (can be phased).
- **Infrastructure**: `docker-compose.yml`, `.env.example`, README; possible CI service for Postgres with vector extension.
