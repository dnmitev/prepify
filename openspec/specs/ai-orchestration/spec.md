# ai-orchestration Specification

## Purpose
TBD - created by archiving change saa-c03-exam-prep-platform. Update Purpose after archive.
## Requirements
### Requirement: Multi-role model configuration

The system SHALL support **two or more concurrently configured models** (distinct provider endpoints and/or model identifiers) and SHALL route **workflow steps** to a **named role** (for example `summarization` vs `question_generation`) so cheaper models MAY handle lightweight tasks while more capable models handle structured question synthesis. Configuration SHALL be explicit (files or environment) and SHALL NOT embed raw secrets.

#### Scenario: Summarization uses a different model than generation

- **WHEN** a workflow runs a summarization step and a question-generation step in the same job
- **THEN** each step invokes the model bound to its **role** per configuration, which MAY differ by provider, model name, and pricing tier

### Requirement: Provider-agnostic LLM access

The system SHALL expose an internal **LLM provider abstraction** that supports **pluggable backends** (for example OpenAI-compatible APIs and additional vendors) selected via **configuration**. **Secrets for providers** MUST be loaded from **environment variables** or runtime secret stores and MUST NOT be committed to the repository.

#### Scenario: Missing provider key prevents cloud generation

- **WHEN** a generation workflow runs and no credential exists for the configured provider
- **THEN** the workflow fails with a clear error that does not include secret values

### Requirement: Capture token usage on every LLM call

For each provider response that includes usage metadata, the system SHALL record **prompt (input) token count**, **completion (output) token count**, and **total tokens** when available, together with **provider**, **model identifier**, **workflow or activity name**, and **named role**. Records SHALL feed **token-accounting** persistence for analytics and budgets.

#### Scenario: Generation activity persists usage

- **WHEN** a question-generation activity completes successfully and the provider returns usage fields
- **THEN** a durable usage row exists linked to the job and model role with non-null token counts when the provider supplied them

### Requirement: Temporal workflows for generation and validation

The system SHALL implement **Temporal workflows** (or equivalent durable orchestration named in implementation) for **question generation** and optional **post-generation validation** activities. Workflows SHALL use **retries with backoff** for transient provider errors and SHALL log correlation identifiers for traceability.

#### Scenario: Retry on transient LLM error

- **WHEN** a provider returns a retryable error
- **THEN** the activity retries according to policy and either succeeds or surfaces a final failure reason

### Requirement: Structured output contract for generated items

The system SHALL require generated content to conform to a **defined schema** (question stem, options, correctness flags, explanations) so invalid generations are **rejected** before persistence.

#### Scenario: Malformed generation discarded

- **WHEN** activity output fails schema validation
- **THEN** no `question-items` record is created from that output and the job records validation failure

### Requirement: No blocking synchronous dependency for interactive UI

The system SHALL **not** require the interactive exam UI to wait on LLM calls; generation jobs SHALL run **asynchronously** and notify or poll via stable job identifiers.

#### Scenario: UI polls job status

- **WHEN** a user requests AI generation from the web client
- **THEN** the API returns a **job id** immediately and the client retrieves status without holding an open LLM connection

### Requirement: Local OpenAI-compatible backends for development

The system SHALL support configuring generation activities to call an **OpenAI-compatible HTTP API** hosted locally (for example **Ollama** exposing `/v1/chat/completions`) using **`OPENAI_BASE_URL`** (and related documented variables). When that endpoint does not enforce API-key authentication, the worker SHALL NOT fail solely due to a missing **`OPENAI_API_KEY`** if documented local-dev rules are satisfied (for example using an empty value or a documented placeholder).

#### Scenario: Local endpoint without cloud API key

- **WHEN** question generation is configured with provider **`openai`**, **`OPENAI_BASE_URL`** refers to a local OpenAI-compatible server that does not require a secret, and credentials follow README guidance
- **THEN** the generation activity completes successfully without requiring a paid cloud provider API key

#### Scenario: Clear failure when cloud provider expects a key

- **WHEN** **`OPENAI_BASE_URL`** targets a provider that requires authentication and no valid credential is supplied
- **THEN** the activity fails with an actionable error message that does not leak secrets

### Requirement: Batch orchestration of multiple generated questions per job

The system SHALL support enqueueing a generation job with **targetQuestionCount** greater than or equal to **1**. The Temporal workflow SHALL execute **one question-generation activity invocation per target question**, in sequence, after any optional summarization step completes. When summarization is enabled for the job, the summarization activity SHALL run **at most once** before the first question-generation activity for that workflow run. The workflow SHALL persist **progress** toward the target count so API consumers MAY observe how many questions completed before the workflow finishes.

#### Scenario: Summarize once then generate multiple items

- **WHEN** summarization is enabled and **targetQuestionCount** is greater than **1**
- **THEN** the summarization activity executes **once** and subsequent question-generation activities MUST NOT invoke the summarization-role LLM again for that job run

#### Scenario: Progress reflects completed generations

- **WHEN** each question-generation activity successfully persists a question linked to the job
- **THEN** durable job state reflects the number of completed questions versus **targetQuestionCount** while the workflow is still running or after completion

### Requirement: Exam-scoped generation workflow inputs

Temporal **question-generation workflows** SHALL accept inputs that include **`examTypeCode`** (and sufficient correlation identifiers for token accounting). Generation activities SHALL build prompts using **exam and domain catalog context** rather than relying solely on a free-form user topic.

#### Scenario: Generation uses exam context

- **WHEN** a generation job is started for a valid **`examTypeCode`**
- **THEN** the question-generation step receives structured exam/domain context derived from the catalog for use in the LLM prompt

### Requirement: Optional summarization step

The workflow SHALL support **`summarize`** (or equivalent) as a **boolean** control. When **`summarize`** is **false**, the system SHALL **not** invoke the **`summarization`** model role for that job (no summarization-role LLM call and no summarization token usage attributed to that step). When **`summarize`** is **true**, the system SHALL run the summarization step before generation using the configured summarization role.

#### Scenario: Summarization skipped when disabled

- **WHEN** the client sets **`summarize`** to **false** on enqueue
- **THEN** no summarization-role LLM invocation occurs for that workflow run

#### Scenario: Summarization runs when enabled

- **WHEN** the client sets **`summarize`** to **true** on enqueue
- **THEN** the summarization activity executes before generation and MAY consume the summarization role configuration

### Requirement: Optional topic hint for generation

The system SHALL accept an optional **`topicHint`** string alongside **`examTypeCode`** when provided by the client; when omitted, generation MUST rely on exam-scoped catalog context only. The hint MUST narrow scenario focus (for example “VPC security groups”) and MUST NOT replace exam identity.

#### Scenario: Topic hint passed to generation when provided

- **WHEN** **`topicHint`** is supplied with **`examTypeCode`**
- **THEN** the generation prompt MAY incorporate that hint while preserving exam-scoped blueprint context

### Requirement: Named roles for failure summarization, teaching, and embeddings

The system SHALL support **distinct named configuration roles** for **post-exam failure summarization**, **post-exam teaching feedback**, and **embedding generation**, so local development MAY map summarization to a small local model, teaching to a larger model, and embeddings to a dedicated embedding endpoint, while remote deployments MAY map them to **cost-appropriate** providers. Secrets and base URLs SHALL follow existing provider configuration rules.

#### Scenario: Teaching uses a different role than summarization

- **WHEN** the post-exam training workflow runs both summarization and teaching steps
- **THEN** each step invokes the model configuration bound to its **named role** and those roles MAY differ by provider and model identifier

#### Scenario: Embeddings use a dedicated role or endpoint

- **WHEN** training records are embedded for storage
- **THEN** embedding invocation uses the **embedding** role or equivalent documented configuration separate from chat completion roles

### Requirement: Temporal workflow for post-exam training with retries

The system SHALL implement **post-exam training** as a **Temporal workflow** with **activities** for data load, summarization, teaching, persistence, and embedding, applying **retries with backoff** for transient provider errors and **idempotent** workflow identification per **attempt** as documented in design.

#### Scenario: Transient LLM failure retries

- **WHEN** a provider returns a retryable error during summarization or teaching
- **THEN** the affected activity retries according to policy and either succeeds or records a final failure reason without corrupting finalized attempt results

### Requirement: Structured persistence contract for training outputs

Activities SHALL persist **schema-validated** training outputs (for example JSON or validated text sections) before embeddings are written, so invalid model output does not create partial vector rows without corresponding narrative records.

#### Scenario: Invalid teaching output is rejected

- **WHEN** teaching activity output fails validation
- **THEN** no durable teaching record is marked complete for that attempt stage and the workflow records a validation failure per implementation policy

