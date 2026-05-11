## ADDED Requirements

### Requirement: Start a timed attempt with unseen unscored slots

The system SHALL allow a user to **start an attempt** for a chosen exam type. Each attempt SHALL track **remaining active time** derived from the exam type **duration** at start, decremented only while the attempt is **in progress and not paused** (server-authoritative). For **SAA-C03**, the engine SHALL assemble **65** items and SHALL randomly designate **15** positions as **unscored** such that the participant **cannot** tell which items are unscored during the attempt.

#### Scenario: Attempt inherits duration

- **WHEN** a user starts an **SAA-C03** attempt and the configured duration is **120** minutes
- **THEN** the attempt records **120** minutes of **allocated active time** (or equivalent seconds), unscored designation is fixed for that attempt, and the timer counts down only during **active** (non-paused) periods

### Requirement: Pause and resume attempts

The system SHALL allow the user to **pause** an in-progress attempt and **resume** it later. While **paused**, the **exam timer SHALL NOT consume remaining time**. The system SHALL persist pause/resume transitions durably so reloads and reconnects restore correct **remaining time** and attempt status.

#### Scenario: Timer freezes while paused

- **WHEN** a user pauses with **45** minutes remaining and stays paused for **10** minutes wall-clock time
- **THEN** upon resume, approximately **45** minutes of exam time remain (subject to server rounding rules documented in implementation)

#### Scenario: Resume continues same attempt

- **WHEN** a user resumes a paused attempt
- **THEN** the same attempt id, question ordering, unscored designation, and saved answers remain unchanged

### Requirement: Recover in-progress state after browser reload

The system SHALL support restoring full attempt context **without data loss** after a **full page reload** or new browser session: the client SHALL obtain a stable **attempt identifier** (for example via URL route or explicit resume token) and the server SHALL return **remaining active time**, **pause state**, **current item selections**, and navigation position needed to continue.

#### Scenario: Reload restores answers and timer

- **WHEN** a user reloads the page during an active or paused attempt
- **THEN** after reload the UI reloads attempt state from the server and shows the same responses and remaining time as before reload

### Requirement: Accept and persist answers during the attempt

The system SHALL accept **answer selections** (one or more option indices per item, consistent with item format) until submission or expiry. The system SHALL persist responses durably so refresh or reconnect does not lose recorded answers.

#### Scenario: Mid-attempt save

- **WHEN** a user selects answers for **10** items and reloads the client
- **THEN** the same attempt shows the previously saved selections for those items

### Requirement: Enforce active time limit

The system SHALL **block further answer changes** after **remaining active time reaches zero** (server-authoritative) and SHALL treat non-submitted items as **incorrect** for scored items per exam policy. **Paused** attempts SHALL NOT expire until resumed and the remaining active time elapses.

#### Scenario: Auto-close on expiry

- **WHEN** remaining active time reaches **zero** before explicit submission
- **THEN** the system finalizes the attempt and computes results using answers recorded up to expiry

### Requirement: Score only scored slots with scaled approximation

The system SHALL compute results using **only** items not designated **unscored** for that attempt. The system SHALL produce a **scaled score in the range 100–1000** using the documented **approximation** from design, and SHALL mark **pass** when the scaled score is **greater than or equal to** the exam type passing threshold (**720** for SAA-C03).

#### Scenario: Pass when approximation meets threshold

- **WHEN** the participant’s performance on **50** scored items maps to a scaled score of **725**
- **THEN** the attempt outcome is **pass** for **SAA-C03**

### Requirement: Summarize performance by domain

The system SHALL report an **optional breakdown** of outcomes **by domain** for items that were scored in that attempt, using domain tags on questions.

#### Scenario: Domain breakdown after submit

- **WHEN** an attempt completes
- **THEN** the user can view accuracy or score contribution grouped by each **SAA-C03** domain
