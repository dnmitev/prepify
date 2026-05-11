# post-exam-learning-memory Specification

## Purpose

Define **post-exam AI training** for incorrect scored practice items: a **Temporal** workflow, **English-only** two-stage LLM output (summaries then teaching), **PostgreSQL** + **`pgvector`** storage, and **retrievable memory** for downstream coaching.

## Requirements

### Requirement: Post-exam training workflow for incorrect scored items

When a **practice attempt** is **finalized** and has **at least one incorrect answer on a scored item**, the system SHALL enqueue a **durable Temporal workflow** that generates **English-only** training artifacts from those failures. When there are **no** incorrect scored items, the system SHALL NOT enqueue this workflow for that attempt. The interactive exam UI SHALL NOT block on workflow completion.

#### Scenario: Workflow starts after failed scored items

- **WHEN** an attempt transitions to a **finalized** outcome and the scored results include **at least one** incorrect item
- **THEN** the system starts (or idempotently ensures) a **post-exam training** workflow correlated with that **attempt identifier**

#### Scenario: No workflow when perfect on scored items

- **WHEN** a finalized attempt has **zero** incorrect scored items
- **THEN** no post-exam training workflow is required for that attempt

### Requirement: Two-stage model pipeline for summaries and teaching

The post-exam training workflow SHALL invoke a **smaller or cheaper configured model role** to produce **per-failure summaries** (concise English), then invoke a **more capable configured model role** to produce **teaching feedback** and **supplementary knowledge** grounded in those summaries and item metadata. Both stages SHALL use **English** output only.

#### Scenario: Summaries precede teaching

- **WHEN** the workflow processes multiple incorrect scored items
- **THEN** per-failure summarization completes (or is batched per documented policy) before the teaching-role call that produces consolidated learner-facing guidance

#### Scenario: Token usage is attributable

- **WHEN** each model invocation completes
- **THEN** usage metadata is recorded per existing **token-accounting** rules for the distinct **named roles** used in this workflow

### Requirement: Persist training records and vector embeddings

The system SHALL persist **durable training records** linked to the **attempt** and referenced **question or item identifiers**, including summary text, teaching text, and metadata needed for audit. The system SHALL compute **embedding vectors** for retrieval (for example per chunk or per record per documented chunking) and store them in **PostgreSQL** using the **`pgvector`** extension with indexes suitable for similarity search.

#### Scenario: Vectors are queryable by similarity

- **WHEN** a retrieval request supplies a **query embedding** for a learner context
- **THEN** the system returns up to **k** nearest stored training chunks for that learner (or scoped policy defined in implementation) ordered by similarity

#### Scenario: English-only stored content

- **WHEN** training rows are written
- **THEN** narrative fields are **English** and the system does not require localization for this capability

### Requirement: Retrievable memory reduces redundant LLM context

Downstream LLM-assisted features SHALL be able to obtain **relevant past training excerpts** via the stored vectors so that repeated coaching MAY reuse persisted knowledge instead of regenerating full explanations from scratch when retrieval matches are sufficient.

#### Scenario: Retrieval returns excerpts for prompt injection

- **WHEN** a component requests training memory for a learner with a valid query embedding
- **THEN** the system returns **text excerpts** and identifiers sufficient to cite them in a downstream prompt
