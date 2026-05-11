## 1. Database and types

- [x] 1.1 Add nullable **`exam_type_code`** (and optional **`topic_hint`**) to **`generation_jobs`** via Drizzle schema + SQL migration; generate migration with drizzle-kit.
- [x] 1.2 Document breaking API expectation in README if legacy **`topic`**-only clients exist.

## 2. API

- [x] 2.1 Change **`POST /jobs/generate`** to require **`examTypeCode`**, resolve **`exam_types`** row + domains; optional **`topicHint`**, optional **`summarize`** (default **`false`** per design unless overridden); persist fields on insert.
- [x] 2.2 Return **400** with clear message when exam code unknown.

## 3. Worker (Temporal)

- [x] 3.1 Extend **`generateQuestionWorkflow`** input: **`examTypeCode`**, **`topicHint`**, **`summarize`**; when **`summarize`** is **false**, skip **`summarizeTopic`** LLM activity (no summarization token rows).
- [x] 3.2 Load exam/domain context from DB in **`generateQuestionItem`** (or preceding activity) when summarization skipped; pass structured context + optional hint into **`runQuestionGenerationModel`** / prompt builder.
- [x] 3.3 When **`summarize`** is **true**, preserve existing summarize → generate ordering.

## 4. Frontend

- [x] 4.1 Update **`/admin/jobs`**: fetch **`GET /exams`** (or catalog endpoint), **exam dropdown** by code; optional topic hint field; **checkbox** “Run summarization step” bound to **`summarize`**.
- [x] 4.2 Adjust request body JSON sent to **`POST /jobs/generate`**.

## 5. Verification

- [x] 5.1 Add or extend unit/integration coverage for validation paths (unknown exam, summarize flag behavior where testable without live LLM).
- [x] 5.2 Run **`npm test --workspaces --if-present`** and **`npm run build --workspaces --if-present`**; manual smoke: enqueue with **`summarize: false`** and mock providers.
