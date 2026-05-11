## 1. Database and shared types

- [ ] 1.1 Add migration enabling **`pgvector`** and creating tables for **training records** and **embedding rows** (attempt id, user id if present, question/item refs, English text fields, `embedding_model`, `embedding_dim`, timestamps); add indexes for lookup by attempt and similarity search per design.
- [ ] 1.2 Add **`@prepify/db`** (or shared) types/repositories for inserting and querying training + vectors; export any IDs needed by worker/API.
- [ ] 1.3 Run **`npm test --workspaces --if-present`** and **`npm run build`** after schema changes; commit with a conventional message; mark **1.1–1.3** `[x]` only after checks pass.

## 2. Configuration and providers

- [ ] 2.1 Extend env / config for **named roles**: failure summarization, post-exam teaching, embedding (and document **English-only** assumption in comments or README); update **`.env.example`** without secrets.
- [ ] 2.2 Implement **embedding client** abstraction (local OpenAI-compatible or provider-specific) with dimension validation against DB migration.
- [ ] 2.3 Wire **token usage** logging for new roles to existing accounting paths where applicable.
- [ ] 2.4 Run tests + build for touched packages; commit; mark `[x]` when done.

## 3. Temporal worker: post-exam training workflow

- [ ] 3.1 Register **`PostExamTrainingWorkflow`** (name as implemented) with **deterministic workflow id** per attempt; implement activities: load incorrect scored items, summarize, teach, validate payload, persist, embed+upsert.
- [ ] 3.2 Add **retry policies** and **idempotent** persistence (upsert / stage flags) so partial failures recover cleanly.
- [ ] 3.3 Implement **`retrieveTrainingMemory`** (or equivalent) used internally with **top-k** vector search scoped per user/learner policy.
- [ ] 3.4 Add **unit or integration tests** for validation helpers and workflow wiring (mock LLM/embed); run **`npm test -w @prepify/worker`** (or root workspaces); commit; mark `[x]` when done.

## 4. API: finalization hook

- [ ] 4.1 From the **attempt finalization** path (submit / expiry), after results persist, **start workflow** when there is ≥1 incorrect scored item; respect feature flag **`POST_EXAM_TRAINING_ENABLED`** (or equivalent).
- [ ] 4.2 Optional: **GET** training status or payload for an attempt (behind auth); document response shape.
- [ ] 4.3 Run API tests + build; commit; mark `[x]` when done.

## 5. Local runtime: Docker Compose and docs

- [ ] 5.1 Add **embedding** service (and optional **small chat** service) to **`docker-compose.yml`** with documented ports; ensure startup order is consistent with Postgres + Temporal.
- [ ] 5.2 Update **README** local setup: embedding URL, role env mapping, and note **remote** embedding should use a **cheap, reliable** provider.
- [ ] 5.3 Verify **`docker compose config`** (or brief up smoke) does not break existing stack; commit; mark `[x]` when done.

## 6. Web (optional slice) and E2E

- [ ] 6.1 If in scope for first slice: show **“Study guide”** or training summary on **results** or **history** when workflow completed (loading/error states).
- [ ] 6.2 Extend Playwright **smoke or new spec** only if UI/API surface is added; otherwise document manual verification in PR.
- [ ] 6.3 Run **`npm run build`** and targeted tests; commit; mark `[x]` when done.

## 7. Final verification

- [ ] 7.1 Run **`npm test --workspaces --if-present`** and **`npm run build`** from repo root.
- [ ] 7.2 Manual: one attempt with wrong answers → Temporal workflow completes → DB has training + vectors → retrieval returns chunks for a probe query.
- [ ] 7.3 Mark **7.1–7.3** `[x]` only after verification; prepare PR description referencing **`post-exam-learning-memory`** and modified specs.
