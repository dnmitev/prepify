## Context

Prepify already runs **Temporal** workflows for AI-heavy jobs and uses **multi-role LLM configuration** (`ai-orchestration`). Practice attempts are scored server-side and finalized on submit or expiry (`practice-session`). There is no today-first-class **post-attempt remediation** store or **vector retrieval** over a learner’s past mistakes.

Constraints from product input: **English only**; **local dev** should use **Compose-hosted** embedding (and optionally small chat) models; **remote** should use a **cheap, reliable** embedding path; training must be **durable** and **reusable** as **LLM memory** to reduce repeated full-context calls.

## Goals / Non-Goals

**Goals:**

- Automatically enqueue **post-exam training generation** when a finalized attempt has **≥1 incorrect scored item**.
- **Two-stage LLM pipeline**: (1) compact per-item **failure summary** via a **small/cheap role**; (2) **aggregate teaching** (feedback + knowledge pointers) via a **stronger role**, grounded in those summaries and item metadata.
- Persist text + **embeddings** in Postgres **`pgvector`** with stable links to **attempt**, **user** (if applicable), and **question/item** identifiers for retrieval.
- Expose a **retrieval** path (worker-internal and/or API) so future prompts can **inject top-k** relevant past training chunks.
- Extend **docker-compose** with embedding service(s) and document env for local vs remote.

**Non-Goals:**

- Multi-language training or UI copy beyond English.
- Real-time streaming of training to the client during the exam (workflow is **async** after finalization).
- Replacing the full exam delivery engine or question authoring pipeline.
- Perfect deduplication of semantically duplicate mistakes in v1 (may use simple idempotency keys per attempt).

## Decisions

1. **Orchestration: Temporal child workflow or dedicated workflow**  
   **Decision:** Implement a **dedicated Temporal workflow** (e.g. `PostExamTrainingWorkflow`) started with `{ attemptId, correlationId }`, with activities: load incorrect scored items → summarize each failure → aggregate teach → persist rows → embed and upsert vectors.  
   **Rationale:** Matches existing `ai-orchestration` pattern, gives retries, visibility, and idempotency hooks.  
   **Alternatives:** Inline async in API (worse durability); message queue without Temporal (duplicates operational surface).

2. **Trigger point**  
   **Decision:** Start the workflow from the **same code path that finalizes scoring** (API or worker callback), **after** results are committed, using **at-least-once** start with **workflow id** derived from `attemptId` to avoid duplicate training for the same attempt.  
   **Rationale:** Guaranteed correlation with final item outcomes; exam UI stays non-blocking.

3. **Embedding model topology**  
   **Decision:** Pluggable **embedding provider** (OpenAI-compatible HTTP or dedicated client) selected by env; **local Compose** runs a small embedding server (e.g. **tei**, **ollama embed**, or similar—exact image TBD in implementation) with dimension fixed in migration.  
   **Rationale:** Satisfies “local model in compose” and “cheap remote” without hard-coding one vendor.  
   **Alternatives:** Always-remote embeddings (fails offline dev); embed inside worker process (heavy container, worse scaling).

4. **Schema: vectors + prose**  
   **Decision:** Store (a) **normalized training records** (summary text, teaching text, metadata JSON, language=`en`), (b) **vector rows** referencing those records with `pgvector` column and **IVFFlat/HNSW** per ops guidance.  
   **Rationale:** Clear separation for RAG chunking and re-embedding if model changes (version column).

5. **Memory retrieval contract**  
   **Decision:** Internal function `retrieveTrainingMemory({ userId, queryEmbedding, k })` returning chunks + scores; optional HTTP for admin/debug only in early phases.  
   **Rationale:** Keeps worker-centric usage simple; API can grow later.

6. **Idempotency**  
   **Decision:** Workflow uses deterministic **workflow ID** per attempt; activities use **upsert** semantics for training rows. Re-run after partial failure completes missing pieces without duplicating teaching sections (implementation may use “stage” flags).  
   **Rationale:** Safe under Temporal retries.

## Risks / Trade-offs

- **[Risk] Embedding model or dimension change invalidates index** → Mitigation: store **embedding_model** + **dimension** per row; migration playbook to re-embed.
- **[Risk] pgvector not enabled in some environments** → Mitigation: migration enables extension; CI Postgres image documented with vector support.
- **[Risk] Cost spikes if large models run per item** → Mitigation: **batch** failures into one teaching call with token budget; enforce **max items** per attempt slice (config).
- **[Risk] PII in prompts** → Mitigation: prompts use **exam content and anonymized attempt refs** only; no raw account identifiers in model text where avoidable.
- **[Risk] All-wrong or very long attempts** → Mitigation: configurable **cap** with ordered truncation (e.g. worst domains first).

## Migration Plan

1. Land DB migration: extension `vector`, new tables, indexes.  
2. Deploy worker with workflow registered (feature flag or env `POST_EXAM_TRAINING_ENABLED`).  
3. Deploy API finalization hook behind same flag.  
4. Add Compose services + `.env.example`.  
5. Enable in staging → validate one SAA-C03 attempt with failures → inspect DB + Temporal.  
6. **Rollback:** disable flag; workflows drain; data retained for re-enable.

## Open Questions

- Exact **Compose image** for local embeddings (TEI vs Ollama vs other) and target **vector dimension**.  
- Whether **teaching output** is one block per attempt or **per domain** sections.  
- UI placement: **results page** only vs **history** detail in v1.
