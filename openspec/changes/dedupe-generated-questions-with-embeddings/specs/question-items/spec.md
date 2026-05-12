## ADDED Requirements

### Requirement: Store embeddings for accepted generated questions

The system SHALL persist an embedding record for each accepted AI-generated question before the question is considered available for normal practice use. The embedding record SHALL reference the question, embedding model, embedding dimension, and canonical text hash used to create the vector.

#### Scenario: Accepted generated question has embedding

- **WHEN** an AI-generated question passes structural validation and duplicate detection
- **THEN** the system stores the question and a durable embedding record linked to that question

#### Scenario: Embedding metadata is auditable

- **WHEN** an operator inspects a generated question embedding
- **THEN** the record identifies the embedding model, dimension, and canonical text hash used for the vector

### Requirement: Detect semantic duplicates before storing generated questions

The system SHALL compare each structurally valid AI-generated question candidate against stored question embeddings in the same exam and domain scope before inserting the candidate as a usable question. If the nearest-match similarity is greater than or equal to the configured hard duplicate threshold, the candidate MUST NOT be inserted as a question.

#### Scenario: Duplicate candidate is skipped

- **WHEN** a generated candidate has nearest-match similarity greater than or equal to the configured hard duplicate threshold within the same exam and domain
- **THEN** the system skips the candidate and does not create a `questions` row for it

#### Scenario: Distinct candidate is persisted

- **WHEN** a generated candidate has nearest-match similarity below the configured hard duplicate threshold within the same exam and domain
- **THEN** the system persists the question and stores its embedding for future comparisons

#### Scenario: Comparison scope excludes unrelated domains

- **WHEN** a generated candidate is compared for duplicate detection
- **THEN** the hard duplicate decision only uses candidate matches from the same exam type and domain unless an explicit broader scope is configured

### Requirement: Record duplicate-skip outcomes for generated question jobs

The system SHALL record duplicate-skip outcomes for generation jobs, including at minimum the number of skipped duplicate candidates and enough nearest-match metadata to debug threshold behavior without storing raw provider secrets.

#### Scenario: Job records skipped duplicate count

- **WHEN** one or more generated candidates are skipped because they exceeded the hard duplicate threshold
- **THEN** the generation job status data exposes the duplicate-skipped count

#### Scenario: Nearest match is inspectable

- **WHEN** a generated candidate is skipped as duplicate
- **THEN** the system records the nearest existing question identifier and similarity score or an equivalent audit record for later quality review
