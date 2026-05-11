## ADDED Requirements

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
