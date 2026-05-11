## ADDED Requirements

### Requirement: Batch orchestration of multiple generated questions per job

The system SHALL support enqueueing a generation job with **targetQuestionCount** greater than or equal to **1**. The Temporal workflow SHALL execute **one question-generation activity invocation per target question**, in sequence, after any optional summarization step completes. When summarization is enabled for the job, the summarization activity SHALL run **at most once** before the first question-generation activity for that workflow run. The workflow SHALL persist **progress** toward the target count so API consumers MAY observe how many questions completed before the workflow finishes.

#### Scenario: Summarize once then generate multiple items

- **WHEN** summarization is enabled and **targetQuestionCount** is greater than **1**
- **THEN** the summarization activity executes **once** and subsequent question-generation activities MUST NOT invoke the summarization-role LLM again for that job run

#### Scenario: Progress reflects completed generations

- **WHEN** each question-generation activity successfully persists a question linked to the job
- **THEN** durable job state reflects the number of completed questions versus **targetQuestionCount** while the workflow is still running or after completion
