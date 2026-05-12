## 1. Database And Repository Layer

- [x] 1.1 Add a database migration for `question_embeddings` with pgvector storage, embedding metadata, canonical text hash, and indexes for exam/domain-scoped nearest-neighbor lookup; run `npm test -w @prepify/db`, commit, then mark this task complete.
- [x] 1.2 Add generation job duplicate/attempt counters or equivalent audit rows for skipped candidates and nearest-match metadata; run `npm test -w @prepify/db`, commit, then mark this task complete.
- [x] 1.3 Add DB exports/repository helpers for inserting question embeddings and searching nearest question neighbors by cosine distance within exam/domain scope; cover helper behavior where feasible, run `npm test -w @prepify/db`, commit, then mark this task complete.

## 2. Shared Dedupe Logic

- [x] 2.1 Add deterministic helper(s) for canonical generated-question text, including exam code, domain code, format, stem, and ordered option text while excluding explanations; run `npm test -w @prepify/shared`, commit, then mark this task complete.
- [x] 2.2 Add threshold decision helper(s) for hard duplicate and review-band similarity outcomes, including config parsing defaults; run `npm test -w @prepify/shared`, commit, then mark this task complete.

## 3. Worker Integration

- [x] 3.1 Generalize or wrap the existing embedding client so question dedupe can use the configured embedding provider/model without depending on post-exam naming; run `npm test -w @prepify/worker`, commit, then mark this task complete.
- [x] 3.2 Add the duplicate gate after generated-question schema validation and before question insertion, including embedding generation, nearest-neighbor search, hard-threshold skip behavior, and usage accounting with a dedupe-specific embedding role; run `npm test -w @prepify/worker`, commit, then mark this task complete.
- [ ] 3.3 Update batch workflow behavior so skipped duplicates trigger bounded replacement attempts while completed progress counts only accepted persisted questions; run `npm test -w @prepify/worker`, commit, then mark this task complete.
- [ ] 3.4 Ensure embedding failures fail the job with a clear message and do not persist candidate questions; add tests for provider failure or invalid embedding responses, run `npm test -w @prepify/worker`, commit, then mark this task complete.

## 4. API, Web, And Configuration

- [ ] 4.1 Expose duplicate skip count and candidate attempt count in existing generation job status/API responses; run `npm test -w @prepify/api`, commit, then mark this task complete.
- [ ] 4.2 Show duplicate skip/attempt information on the admin generation jobs page without changing the generation request flow; run relevant web tests or `npm test -w @prepify/web` if available, commit, then mark this task complete.
- [ ] 4.3 Document `QUESTION_DUPLICATE_HARD_THRESHOLD`, `QUESTION_DUPLICATE_REVIEW_THRESHOLD`, and `QUESTION_GENERATION_MAX_ATTEMPT_MULTIPLIER` in `.env.example` and README local AI guidance; run docs-relevant checks if available, commit, then mark this task complete.

## 5. Verification And Tuning

- [ ] 5.1 Add an integration or worker-level test proving a high-similarity duplicate candidate is skipped and a below-threshold candidate is persisted with an embedding; run the targeted package test, commit, then mark this task complete.
- [ ] 5.2 Run `npm test --workspaces --if-present` and `npm run build` after all implementation tasks are complete, fix regressions, commit final task updates, then mark this task complete.
- [ ] 5.3 Manually smoke-test a local generation job with mock embeddings and, when available, a real local embedding model to verify counters, threshold behavior, and accepted question count.
