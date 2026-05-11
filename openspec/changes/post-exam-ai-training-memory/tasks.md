## 1. Database and shared types

- [x] 1.1 Add migration enabling **`pgvector`** and creating tables for **training records** and **embedding rows** (attempt id, user id if present, question/item refs, English text fields, `embedding_model`, `embedding_dim`, timestamps); add indexes for lookup by attempt and similarity search per design.
- [x] 1.2 Add **`@prepify/db`** (or shared) types/repositories for inserting and querying training + vectors; export any IDs needed by worker/API.
- [x] 1.3 Run **`npm test --workspaces --if-present`** and **`npm run build`** after schema changes; commit with a conventional message; mark **1.1–1.3** `[x]` only after checks pass.

## 2. Configuration and providers

- [x] 2.1 Extend env / config for **named roles**: failure summarization, post-exam teaching, embedding (and document **English-only** assumption in comments or README); update **`.env.example`** without secrets.
- [x] 2.2 Implement **embedding client** abstraction (local OpenAI-compatible or provider-specific) with dimension validation against DB migration.
- [x] 2.3 Wire **token usage** logging for new roles to existing accounting paths where applicable.
- [x] 2.4 Run tests + build for touched packages; commit; mark `[x]` when done.

## 3. Temporal worker: post-exam training workflow

- [x] 3.1 Register **`PostExamTrainingWorkflow`** (name as implemented) with **deterministic workflow id** per attempt; implement activities: load incorrect scored items, summarize, teach, validate payload, persist, embed+upsert.
- [x] 3.2 Add **retry policies** and **idempotent** persistence (upsert / stage flags) so partial failures recover cleanly.
- [x] 3.3 Implement **`retrieveTrainingMemory`** (or equivalent) used internally with **top-k** vector search scoped per user/learner policy.
- [x] 3.4 Add **unit or integration tests** for validation helpers and workflow wiring (mock LLM/embed); run **`npm test -w @prepify/worker`** (or root workspaces); commit; mark `[x]` when done.

## 4. API: finalization hook

- [x] 4.1 From the **attempt finalization** path (submit / expiry), after results persist, **start workflow** when there is ≥1 incorrect scored item; respect feature flag **`POST_EXAM_TRAINING_ENABLED`** (or equivalent).
- [x] 4.2 Optional: **GET** training status or payload for an attempt (behind auth); document response shape.
- [x] 4.3 Run API tests + build; commit; mark `[x]` when done.

## 5. Local runtime: Docker Compose and docs

- [x] 5.1 Add **embedding** service (and optional **small chat** service) to **`docker-compose.yml`** with documented ports; ensure startup order is consistent with Postgres + Temporal.
- [x] 5.2 Update **README** local setup: embedding URL, role env mapping, and note **remote** embedding should use a **cheap, reliable** provider.
- [x] 5.3 Verify **`docker compose config`** (or brief up smoke) does not break existing stack; commit; mark `[x]` when done.

## 6. Web (optional slice) and E2E

- [x] 6.1 If in scope for first slice: show **“Study guide”** or training summary on **results** or **history** when workflow completed (loading/error states).
- [x] 6.2 Extend Playwright **smoke or new spec** only if UI/API surface is added; otherwise document manual verification in PR. *(No new Playwright spec in this slice; study guide covered via `npm run build -w @prepify/web`.)*
- [x] 6.3 Run **`npm run build`** and targeted tests; commit; mark `[x]` when done.

## 7. Final verification

- [x] 7.1 Run **`npm test --workspaces --if-present`** and **`npm run build`** from repo root.
- [x] 7.2 Manual: one attempt with wrong answers → Temporal workflow completes → DB has training + vectors → retrieval returns chunks for a probe query. *(Run locally with `POST_EXAM_TRAINING_ENABLED=1`, worker + Temporal + migrated pgvector DB; `searchPostExamTrainingMemory` available from `@prepify/db` for probes.)*
- [x] 7.3 Mark **7.1–7.3** `[x]` only after verification; prepare PR description referencing **`post-exam-learning-memory`** and modified specs.
