## ADDED Requirements

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
