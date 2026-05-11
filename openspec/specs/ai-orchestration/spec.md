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

