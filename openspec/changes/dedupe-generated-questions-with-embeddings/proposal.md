## Why

AI generation can produce questions that are structurally valid but semantically too similar to questions already in the bank or earlier items from the same batch. Embedding-backed duplicate detection is needed before persistence so generated question data stays varied, useful, and auditable.

## What Changes

- Add a question-level embedding record for accepted generated questions, scoped by exam and domain for similarity search.
- Add a duplicate-detection gate after generated-question schema validation and before question persistence.
- Compare each generated candidate against existing question embeddings and accepted questions from the same job using configurable cosine-similarity thresholds.
- Skip candidates that exceed the hard duplicate threshold, record duplicate-skip outcomes, and continue generation up to a bounded attempt limit when more accepted questions are needed.
- Record embedding usage through existing LLM usage accounting when providers return usage metadata.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `question-items`: Generated questions are embedded and checked for semantic duplicates before they become usable question-bank items.
- `ai-orchestration`: Question-generation workflows include embedding, similarity search, duplicate skip/retry handling, and usage accounting for the dedupe step.

## Impact

- Database: add question embedding storage using existing pgvector infrastructure; add job-level duplicate/attempt counters or equivalent audit records.
- Worker: add canonical question text construction, embedding invocation, vector search, threshold evaluation, and bounded retry orchestration.
- Shared validation: add deterministic helpers for duplicate threshold decisions and canonical candidate text if appropriate.
- API/web: expose duplicate-skip counts in generation job status where job status is already shown.
- Configuration: document threshold and attempt-limit environment variables with safe defaults.
