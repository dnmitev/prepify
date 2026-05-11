## Context

Generation today is triggered with a **topic string** and always runs **`summarizeTopic`** before **`generateQuestionItem`**. The catalog already defines exam types and domains; the admin UI does not bind generation to that metadata.

## Goals / Non-Goals

**Goals:**

- Require **exam selection** (by stable exam code) for enqueueing generation jobs; feed **exam + domain metadata** into the generation prompt.
- Make **summarization** a **separate, optional** step: when off, **no** summarization-role LLM call and **no** summarization token accounting rows for that job.
- Persist **exam reference** on generation jobs for audit.

**Non-Goals:**

- Multi-exam batch generation in one workflow.
- Replacing seeded practice bank as default exam content.
- Auth / RBAC for admin UI (still dev-helper scope).

## Decisions

### D1 — API contract

**Choice:** `POST /jobs/generate` accepts **`examTypeCode`** (required), optional **`topicHint`** (string), optional **`summarize`** (boolean, default **`false`**). Reject unknown exam codes with **400**.

**Alternatives:** Topic-only backward compat — optional `topic` when `examTypeCode` present; proposal favors exam-first.

### D2 — Workflow shape

**Choice:** Extend workflow input with `examTypeCode`, `topicHint`, `summarize: boolean`. When `summarize` is **false**, skip calling **`summarizeTopic`** as an LLM-backed step—pass **fixed structured context** into generation (exam name, domains JSON from DB or API-shaped snapshot) instead of a free-form summary string.

**Alternatives:** Always call summarize with empty prompt — wastes workers; **rejected**.

### D3 — Persistence

**Choice:** Add **`generation_jobs.exam_type_code`** (text, nullable for legacy rows) + optional **`topic_hint`**; migration backfills null.

### D4 — UI

**Choice:** Admin page loads **`GET /exams`** (or existing catalog endpoint), dropdown by **`code`**, optional topic hint textarea, checkbox **“Use summarization step”** (unchecked default).

## Risks / Trade-offs

- **Prompt length** — Large domain metadata may exceed context → Mitigation: compact prompt template (names + weights only).
- **Breaking clients** posting old `{ topic }` only → Mitigation: return **400** with message to send `examTypeCode`; document in README **BREAKING** for API consumers.

## Migration Plan

1. Ship DB migration + API behind clear validation message.
2. Update worker workflow + activities; deploy worker before or with API (coordinate).
3. Update admin UI.

## Open Questions

- Default for **`summarize`** ( **`false`** vs env **`GENERATION_SUMMARIZE_DEFAULT`**) — resolve in implementation.
