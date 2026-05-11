## Context

Prepify already runs **`generateQuestionWorkflow`** with optional **`summarizeTopic`** then **`generateQuestionItem`**, producing **one** `questions` row per **`generation_jobs`** row. Temporal is configured with retries on activities but the workflow graph is shallow.

## Goals / Non-Goals

**Goals:**

- Generate **N questions** (configurable, bounded) in **one** durable workflow run after shared setup.
- Run **`summarizeTopic` at most once** when **`summarize`** is true, then reuse summary/context across iterations.
- Persist **progress** so operators can poll **`completed/total`** while the workflow runs.
- Attribute **`llm_usage_events`** per generation activity (already keyed by `jobId` + activity).

**Non-Goals:**

- Parallel fan-out of dozens of LLM calls inside one workflow (start sequential loop for predictable rate limiting; parallel children deferred).
- Cross-exam batches in one job (same exam as today).
- Automatic scheduling/cron (manual enqueue remains).

## Decisions

### D1 — API surface

**Choice:** **`POST /jobs/generate`** adds **`questionCount`** (integer, default **1**, minimum **1**, maximum **e.g. 50** env-overridable). Reject out-of-range with **400**.

**Alternatives:** Separate **`POST /jobs/generate/batch`** endpoint — rejected to avoid duplicate validation paths.

### D2 — Workflow shape

**Choice:** Input includes **`questionCount`**. Workflow:

1. Optional **`summarizeTopic`** once when **`summarize`** is true (existing semantics).
2. **`for (let i = 0; i < questionCount; i++)`** `await generateQuestionItem({ ..., iterationIndex: i, questionCount })` (exact signature TBD).
3. Activity updates **`generation_jobs.completed_question_count`** (or equivalent) after **each** successful insert; final status **`succeeded`** only when all **N** succeed.

**Alternatives:** Child workflows per question — heavier ops overhead for modest N; **rejected** until scale demands.

### D3 — Failure semantics (v1)

**Choice:** **Fail-fast**: first failing generation marks job **`failed`** and stops the loop (Temporal retries still apply at activity level for transient errors).

**Alternatives:** Continue-on-partial with **`partial`** status — defer to later change.

### D4 — Prompt variance between iterations

**Choice:** Pass **`iterationIndex`** (0-based) into generation prompt builder so models diversify stems (e.g. “Variation 3 of N—avoid repeating prior framing”). Optional **`topicHint`** remains shared across the batch unless extended later.

### D5 — Persistence

**Choice:** Add **`generation_jobs.target_question_count`** and **`completed_question_count`** (defaults **1** / **0**); increment completed after each persisted question.

## Risks / Trade-offs

- **Long workflow duration** → Mitigation: activity timeouts, documented max **`questionCost`**, worker scaling.
- **Duplicate-ish questions** → Mitigation: iteration hint + future diversity constraints.
- **API abuse** → Mitigation: **`questionCount`** ceiling.

## Migration Plan

1. Ship DB migration (nullable or defaulted columns for backward compatibility).
2. Deploy worker (workflow + activity) before or with API that sends **`questionCount`**.
3. Update admin UI optionally after core path works.

## Open Questions

- Exact **max `questionCount`** (fixed vs env **`GENERATION_MAX_QUESTIONS_PER_JOB`**).
- Whether **`GET /jobs/:id`** returns **all** question ids or capped list + total count.

