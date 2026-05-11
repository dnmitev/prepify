## Why

Temporal excels at **long-running, durable orchestration**: retries, heartbeats, and multi-step flows that can span minutes without tying up HTTP handlers. Today Prepify’s **`generateQuestionWorkflow`** produces **exactly one** question per job then exits—so we barely exercise orchestration depth and enqueue separate workflows when operators want bulk AI items. Expanding one workflow to generate **multiple questions** matches Temporal’s sweet spot (ordered steps, per-item retries, durable progress) and reduces operational friction for filling the bank.

## What Changes

- **Temporal workflow** accepts a **target count** (minimum **1**) and orchestrates **one generation activity per question** after shared setup (optional summarization runs **once** per job when enabled).
- **API** extends **`POST /jobs/generate`** with **`questionCount`** (or equivalent); validates sane bounds (upper limit to protect workers). **BREAKING** only if existing clients reject unknown JSON keys—in practice additive field with server-side default **1** preserves behavior.
- **`generation_jobs`** gains durable fields for **target** and **completed** counts (and optionally stores **last error** context already present).
- **`GET /jobs/:id`** (and admin UX as needed) exposes **progress** and **all generated question ids** linked to the job (not only the first).

## Capabilities

### New Capabilities

- *(No new top-level capability packages—this change adds delta specs under existing capability names below.)*

### Modified Capabilities

- **`ai-orchestration`**: Add requirements for **batch** generation (target count, summarize-once-then-loop, durable progress).
- **`question-items`**: Add explicit requirement that **multiple** questions MAY share one **`generation_job_id`** from a batch workflow.

## Impact

- **`apps/worker`** — workflow loop, possibly refactor generation activity input (iteration index / variance hint); worker bundle registration unchanged unless workflow id/version strategy changes.
- **`apps/api`** — request/response shape for enqueue + job polling.
- **`packages/db`** — migration for generation job progress columns.
- **`apps/web`** — admin jobs page may show count input and progress (optional in same change or fast-follow).

