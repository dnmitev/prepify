## ADDED Requirements

### Requirement: Question generation includes an embedding duplicate gate

The question-generation workflow SHALL run an embedding duplicate gate after generated output passes schema validation and before the candidate is persisted as a question. The gate SHALL use the configured embedding provider/model and SHALL fail the job with a clear error if embeddings are required but unavailable.

#### Scenario: Duplicate gate runs after schema validation

- **WHEN** a question-generation activity receives structurally valid model output
- **THEN** it computes or retrieves an embedding for the canonical candidate text before inserting the question

#### Scenario: Embedding failure is surfaced

- **WHEN** the embedding provider fails or returns an invalid embedding during duplicate detection
- **THEN** the generation job records a clear failure reason and does not persist the candidate question

### Requirement: Batch generation retries skipped duplicate candidates within limits

The question-generation workflow SHALL continue requesting candidates after duplicate skips until either the target accepted question count is reached or the configured maximum candidate attempts is exhausted. The workflow SHALL distinguish accepted question count from attempted candidate count.

#### Scenario: Duplicate skip triggers replacement attempt

- **WHEN** a batch generation job requests five questions and one valid candidate is skipped as duplicate before five accepted questions exist
- **THEN** the workflow requests another candidate if the maximum candidate-attempt limit has not been reached

#### Scenario: Attempt limit stops generation

- **WHEN** duplicate skips prevent the workflow from reaching the requested target count before the maximum candidate-attempt limit is reached
- **THEN** the job records a final status and message that distinguish accepted questions from skipped duplicate candidates

#### Scenario: Progress reflects accepted questions

- **WHEN** duplicate candidates are skipped during a batch generation job
- **THEN** completed question progress counts only accepted persisted questions, while separate attempt or skipped counters reflect duplicate work

### Requirement: Dedupe embedding usage is accounted by generation job

For each embedding provider response used by question duplicate detection that includes usage metadata, the system SHALL record a token usage event linked to the generation job, workflow/activity, provider, model, environment label, and a dedupe-specific embedding role.

#### Scenario: Embedding usage linked to job

- **WHEN** a generated candidate is embedded for duplicate detection and the provider returns usage metadata
- **THEN** a durable usage event is stored for the generation job with a role identifying question dedupe embedding

#### Scenario: Usage record excludes question payload text

- **WHEN** dedupe embedding usage is recorded
- **THEN** the usage row stores metadata and token counts but does not store raw question stem, options, explanations, prompts, completions, or secrets
