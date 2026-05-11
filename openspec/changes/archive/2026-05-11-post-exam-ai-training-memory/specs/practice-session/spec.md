## ADDED Requirements

### Requirement: Finalized attempts with failures enqueue post-exam training

The system SHALL, upon **finalizing** a practice attempt (including submit and auto-close on expiry), evaluate **scored** outcomes and **start or schedule** the **post-exam training** workflow when **at least one scored item is incorrect**, using a **non-blocking** mechanism that does not delay the client’s receipt of finalized results beyond normal persistence latency.

#### Scenario: Submit with mistakes triggers training orchestration

- **WHEN** a user submits an attempt and the server persists a finalized result that includes **at least one incorrect** scored item
- **THEN** the post-exam training workflow for that attempt is **enqueued or started** without requiring the user to wait for AI completion

#### Scenario: Finalize without mistakes skips training

- **WHEN** a finalized attempt has **no** incorrect scored items
- **THEN** the system does not enqueue post-exam training for that attempt
