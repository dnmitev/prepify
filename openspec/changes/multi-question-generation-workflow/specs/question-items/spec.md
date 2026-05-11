## ADDED Requirements

### Requirement: Multiple assessment items from one generation job

The system SHALL allow **more than one** question record to reference the **same** generation job identifier when produced by a single batch generation workflow.

#### Scenario: Trace multiple AI items to one job

- **WHEN** a batch workflow persists two or more AI-generated questions
- **THEN** each question references the shared generation job identifier for auditability
