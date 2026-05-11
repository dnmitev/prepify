## ADDED Requirements

### Requirement: Register exam types with SAA-C03 initial preset

The system SHALL support registration of **exam types** identified by a stable code (e.g., `SAA-C03`) and metadata: human-readable name, **total items per attempt** (65 for SAA-C03), **unscored item count** (15 for SAA-C03), **passing scaled score** (720 on a 100–1000 scale), and **time limit in minutes** (configurable; initial seed **120** for practice with documentation that the official guide lists **130** minutes for the live exam).

#### Scenario: Seed SAA-C03 exam type

- **WHEN** the database is migrated or first-time seed runs
- **THEN** an exam type for **SAA-C03** exists with **65** total items, **15** unscored, **720** passing threshold, and **120** minute duration preset unless overridden by environment configuration

### Requirement: Associate content domains and weights

The system SHALL associate each exam type with **content domains** (for SAA-C03: Design Secure Architectures, Design Resilient Architectures, Design High-Performing Architectures, Design Cost-Optimized Architectures) and each domain SHALL store an official **weight percentage** used for reporting breakdowns.

#### Scenario: Domain weights available for SAA-C03

- **WHEN** an administrator or seeded process registers **SAA-C03**
- **THEN** the four domains exist with weights **30%, 26%, 24%, and 20%** respectively matching the exam guide

### Requirement: Configure exams without code changes

The system SHALL allow **duration**, **pass threshold**, **total items**, and **unscored count** for an exam type to be defined via **configuration or persisted metadata** so that future exams can be added without modifying application source code beyond optional seed scripts.

#### Scenario: Adjust practice duration only

- **WHEN** an operator updates the **SAA-C03** time limit from **120** to **130** minutes in configuration
- **THEN** new practice attempts use **130** minutes without redeploying frontend assets solely for that constant
