# question-items Specification

## Purpose
TBD - created by archiving change saa-c03-exam-prep-platform. Update Purpose after archive.
## Requirements
### Requirement: Store assessment items with single or multiple correct answers

The system SHALL persist **questions** belonging to an exam type and domain. Each question SHALL have a **stem**, one **item format** of either **single-select** (exactly one correct option) or **multi-select** (two or more correct options among listed choices), a **set of answer options**, a designation of **which options are correct**, and **per-option explanation text** or **question-level rationale** sufficient for learning review.

#### Scenario: Multiple-response item persisted

- **WHEN** an author saves a **multi-select** question with **five** options and **two** correct options
- **THEN** the system stores all options, marks the two correct options, and preserves explanations for each option or the question

### Requirement: Support editorial and generated provenance

The system SHALL record whether a question was **imported** from static materials (e.g., `SAA-C003` practice files), **author-created**, or **AI-generated** (with link to a generation job id when applicable).

#### Scenario: Trace AI-generated item

- **WHEN** a question is created from a successful AI generation workflow
- **THEN** the question record references the originating **generation job** identifier for auditability

### Requirement: Multiple assessment items from one generation job

The system SHALL allow **more than one** question record to reference the **same** generation job identifier when produced by a single batch generation workflow.

#### Scenario: Trace multiple AI items to one job

- **WHEN** a batch workflow persists two or more AI-generated questions
- **THEN** each question references the shared generation job identifier for auditability

### Requirement: Validate structural integrity before use in attempts

The system SHALL reject questions that violate structural rules: **at least two options**, **at least one correct option**, **multi-select** MUST have **two or more** correct options, **single-select** MUST have **exactly one** correct option.

#### Scenario: Invalid multi-select rejected

- **WHEN** a client tries to save a **multi-select** with only one correct option
- **THEN** the system rejects the save with a validation error

