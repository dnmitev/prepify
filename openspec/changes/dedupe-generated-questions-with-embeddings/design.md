## Context

Prepify already validates generated question JSON before inserting `questions` and `question_options`. The current batch workflow asks the model for distinct scenarios, but it does not verify semantic uniqueness after generation. Separately, the post-exam learning flow already calls an embedding endpoint and stores pgvector-backed vectors for training memory, so the stack has most of the infrastructure needed for similarity search.

The new concern is question-bank quality: generated questions that are valid but near-duplicates should not become assessment items. The gate belongs after schema validation, because invalid model output should fail for structural reasons first, and before persistence, because duplicate candidates should not create usable question rows.

## Goals / Non-Goals

**Goals:**

- Embed generated question candidates using the configured embedding role.
- Persist embeddings for accepted generated questions.
- Compare candidates against relevant existing question embeddings before insertion.
- Skip hard duplicates and continue generation up to a bounded attempt limit.
- Expose duplicate skip/attempt counts through generation job state.
- Keep token accounting for embedding calls consistent with existing LLM usage events.

**Non-Goals:**

- Retroactively embedding every existing seeded/imported question in the first implementation slice.
- Building a human editorial review queue for borderline similarity matches.
- Replacing structural generated-question validation.
- Guaranteeing perfect semantic dedupe; embeddings are a quality gate, not a proof system.

## Decisions

### Store question embeddings separately from questions

Create a `question_embeddings` table keyed by question id, with `embedding vector(N)`, `embedding_model`, `embedding_dim`, canonical text hash, and timestamps. This avoids binding `questions` to one embedding model forever and lets future re-embedding jobs replace vectors without rewriting core question rows.

Alternative considered: add `embedding` directly to `questions`. Rejected because vectors are model/version artifacts, while question rows are domain data.

### Embed canonical assessment text, not explanations

The canonical text for dedupe should include exam code, domain code, stem, format, and option text in position order. Explanations should be excluded for v1 because they can make distinct questions look artificially similar when they share instructional language.

Alternative considered: stem-only embedding. Rejected because duplicate questions can keep the same answer set while slightly rewording the stem.

### Compare in exam/domain scope first

Vector search should filter by exam type and domain before applying cosine similarity thresholds. This keeps SAA-C03 questions from different blueprint areas from suppressing each other only because AWS vocabulary overlaps.

Alternative considered: global search across all questions. Rejected because cross-exam and cross-domain similarity is too noisy for an automated skip decision.

### Use hard and review thresholds

Use configurable thresholds:

- `QUESTION_DUPLICATE_HARD_THRESHOLD`, default around `0.94`
- `QUESTION_DUPLICATE_REVIEW_THRESHOLD`, default around `0.88`

Candidates at or above the hard threshold are skipped. Candidates in the review band can be accepted but logged as suspicious metadata for later tuning, unless implementation chooses to expose only the hard threshold in v1.

Alternative considered: one threshold only. Rejected because operators need visibility into near misses while tuning without blocking too many useful questions.

### Bounded accepted-count generation

When a candidate is skipped as duplicate, the workflow should request another candidate until `targetQuestionCount` accepted questions exist or a max candidate-attempt limit is reached. Use a configurable multiplier such as `QUESTION_GENERATION_MAX_ATTEMPT_MULTIPLIER`, with `maxAttempts = targetQuestionCount * multiplier`.

Alternative considered: finish with fewer questions. Rejected for the default path because users requested a target count; if the system can safely retry, it should try to fill it.

### Reuse embedding role configuration

The question dedupe gate should reuse the existing embedding provider/model configuration shape (`LLM_ROLE_EMBEDDING_PROVIDER`, `LLM_ROLE_EMBEDDING_MODEL`, and embedding base URL behavior) unless implementation finds a need for a dedicated question-embedding role. LLM usage records should use a distinct role value such as `question_deduplication_embedding` so tokenomics remain understandable.

Alternative considered: introduce a separate provider role immediately. Deferred to avoid config sprawl before there is evidence that question dedupe and post-exam memory need different embedding models.

## Risks / Trade-offs

- [Risk] Embedding thresholds may reject distinct but related questions. -> Mitigation: scope search by exam/domain, start with a conservative hard threshold, log nearest-match metadata, and keep thresholds configurable.
- [Risk] Duplicate retries can increase generation cost. -> Mitigation: use a strict max-attempt multiplier and record embedding/generation usage by job.
- [Risk] Existing questions without embeddings cannot participate in dedupe. -> Mitigation: v1 gates against embedded accepted generated questions; add a task to consider a follow-up backfill job for existing seed/import questions.
- [Risk] Mock embeddings may not produce realistic similarity behavior. -> Mitigation: keep deterministic unit coverage for threshold decisions and use integration/manual smoke tests with a real local embedding model for threshold tuning.

## Migration Plan

1. Add database migration for `question_embeddings` and generation job duplicate/attempt counters or equivalent audit records.
2. Add repository helpers for inserting question embeddings and searching nearest neighbors with pgvector cosine distance.
3. Add worker helpers for canonical candidate text and duplicate threshold evaluation.
4. Add the duplicate gate inside the question-generation activity/workflow before question persistence.
5. Surface duplicate skip and attempt counts through existing generation-job API/UI status.

Rollback is straightforward for code paths: disable the gate through configuration or set the hard threshold above `1.0`. Database rollback would drop the new table and counters only if no accepted deployment depends on them.

## Open Questions

- Should existing seed/imported SAA-C03 questions be embedded in this change, or should that be a separate backfill/admin task?
- Should review-band candidates be persisted with metadata immediately, or is logging enough for the first implementation?
- Should repeated duplicate skips influence prompt text dynamically, for example by adding nearest-match summaries to the next candidate request?
