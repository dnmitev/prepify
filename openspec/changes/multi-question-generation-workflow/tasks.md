## 1. Database

- [x] 1.1 Add **`target_question_count`** and **`completed_question_count`** (or equivalent names) to **`generation_jobs`** via Drizzle + migration; sensible defaults for legacy rows.

## 2. API

- [x] 2.1 Extend **`POST /jobs/generate`** with **`questionCount`** (default **1**, validate min/max); pass through to workflow args; persist target count on insert.
- [x] 2.2 Extend **`GET /jobs/:id`** to return **`targetQuestionCount`**, **`completedQuestionCount`**, and identifiers for **all** questions linked to the job (or document pagination if capped).

## 3. Worker (Temporal)

- [x] 3.1 Extend **`generateQuestionWorkflow`** input with **`questionCount`**; optional summarize once; loop **`questionCount`** times calling generation activity.
- [x] 3.2 Extend **`generateQuestionItem`** (or successor) with **`iterationIndex`** / **`questionCount`** for prompt variance; update **`completed_question_count`** after each successful insert; fail-fast on non-retryable validation errors per design.
- [x] 3.3 Ensure workflow remains deterministic and activity timeouts remain appropriate for multi-step runs.

## 4. Frontend (optional but recommended)

- [x] 4.1 Admin **`/admin/jobs`**: numeric **question count** input; display progress from **`GET /jobs/:id`** after enqueue.

## 5. Verification

- [x] 5.1 Unit tests for API validation bounds; workflow unit tests if project supports workflow testing; otherwise integration smoke with **`questionCount: 2`** and mock LLM provider.
- [x] 5.2 Run **`npm test --workspaces --if-present`** and **`npm run build --workspaces --if-present`**; update README snippet for **`POST /jobs/generate`** body.
