## ADDED Requirements

### Requirement: Exam catalog drives AI generation jobs

The system SHALL allow clients to **choose an exam type from the registered catalog** when enqueueing an **AI generation job**. The enqueue request SHALL identify the exam by stable **`examTypeCode`** (matching **`exam_types.code`**). The system SHALL validate the code and SHALL reject enqueue when the exam type does not exist.

#### Scenario: Valid exam code accepted

- **WHEN** a client submits a generation job with **`examTypeCode`** set to an existing registered exam (e.g. **SAA-C03**)
- **THEN** the job is accepted and persisted with that exam association for traceability

#### Scenario: Unknown exam code rejected

- **WHEN** a client submits **`examTypeCode`** that is not registered
- **THEN** the API returns an error response indicating the exam was not found and the job is not created

### Requirement: Catalog metadata available for prompt construction

For generation tied to an exam type, the system SHALL supply **exam display name** and **associated domain codes, names, and weight percentages** (from persisted catalog data) to the generation pipeline so prompts reflect official blueprint-style context.

#### Scenario: Domains included for SAA-C03 generation

- **WHEN** generation runs for **SAA-C03**
- **THEN** the workflow or generation activity receives domain metadata consistent with the seeded four-domain structure for that exam type
