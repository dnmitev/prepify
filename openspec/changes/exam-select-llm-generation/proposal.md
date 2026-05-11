## Why

Authors trigger AI generation from a **free-text topic** plus a mandatory **summarization** step, which does not align with “generate practice questions **for a specific certification exam**.” Candidates care about **exam context** (blueprint, domains), not an arbitrary topic string. The lightweight summarization model also adds latency and cost even when the **generation** model can consume exam metadata directly. We should **anchor generation to a selected exam** and make **summarization optional** so teams can run generation with a single stronger model when desired.

## What Changes

- **Generation requests** carry a **required or primary `examTypeCode`** (e.g. `SAA-C03`) resolved against the **exam catalog**, replacing topic-driven UX as the default path (optional **topic hint** may remain for fine-tuning prompts).
- **Temporal workflow** passes exam identity (and catalog-derived context such as domain weights/names) into question generation; **summarization activity** runs **only when enabled** via API flag and/or configuration (when disabled, skip LLM summarization entirely—no mock “summary” call unless explicitly desired for testing).
- **Admin / contributor UI** (`/admin/jobs` or equivalent): **exam selector** (from catalog API) instead of topic-only input; controls for **enable summarization** (default off or configurable).
- **Persistence**: generation jobs record **exam type** for traceability (schema migration as needed).
- **Documentation**: README / `.env.example` describe optional summarization behavior.

## Capabilities

### New Capabilities

- _None — requirement deltas live under existing capabilities below._

### Modified Capabilities

- **`exam-catalog`**: Catalog entries SHALL be selectable as the anchor for AI generation jobs (not only for interactive attempts).
- **`ai-orchestration`**: Workflows SHALL accept **exam-scoped** inputs; **summarization** SHALL be **optional** and SHALL NOT invoke the summarization role when disabled.

## Impact

- `apps/api` — `POST /jobs/generate` body shape, validation against `exam_types`, optional fields on `generation_jobs`.
- `apps/worker` — `generateQuestionWorkflow` and activities (`summarizeTopic`, `generateQuestionItem`) — conditional summarization; prompts include exam context.
- `apps/web` — admin jobs page: fetch exams, form fields.
- `packages/db` — optional migration for `generation_jobs.exam_type_code` (or FK).
- Token accounting — summarization events appear only when summarization runs.
