# token-accounting Specification

## Purpose
TBD - created by archiving change saa-c03-exam-prep-platform. Update Purpose after archive.
## Requirements
### Requirement: Persist token usage events

The system SHALL persist a **token usage event** for each completed LLM invocation when usage metadata is available, including: **timestamp**, **provider**, **model id**, **named role** (e.g., `summarization`, `question_generation`), **input token count**, **output token count**, **total token count** (if provided or derived), **correlation identifiers** (job id, workflow id, and/or attempt id as applicable), and an **environment label** (e.g., `development`, `production`, or `test`) to separate dev experiments from later production generation.

#### Scenario: Development run is labeled

- **WHEN** the API or worker is started with a configured environment label of **development**
- **THEN** new token usage events are stored with that label for downstream filtering

### Requirement: Aggregate usage for tokenomics and budgets

The system SHALL support **querying** total tokens (and optional estimated cost if configured) **per job**, **per role**, **per model**, and **per time range** so operators can review spend during **local development** and for **question-generation** workloads.

#### Scenario: Job-level token totals

- **WHEN** an operator requests usage summary for a given **generation job id**
- **THEN** the system returns summed input/output tokens across all LLM calls attributed to that job

### Requirement: Optional estimated cost

When **per-model pricing** configuration exists (non-secret numeric rates or tables in repo), the system MAY compute and store an **estimated monetary cost** alongside token counts for reporting. **Pricing configuration SHALL NOT** contain API keys.

#### Scenario: Cost estimate uses configured rates

- **WHEN** pricing metadata exists for a model and a usage event is recorded
- **THEN** the stored event MAY include an estimated cost derived only from token counts and published rates

### Requirement: No secrets in usage records

Token usage records SHALL NOT store prompts, completions, API keys, or other sensitive payloads—only **metadata** required for analytics.

#### Scenario: Usage row is metadata-only

- **WHEN** a token usage event is written
- **THEN** the record does not contain raw user prompt text or model output text unless explicitly scoped to a separate secured audit feature (out of scope for v1)

