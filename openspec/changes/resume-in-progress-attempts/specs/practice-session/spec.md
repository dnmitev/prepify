## ADDED Requirements

### Requirement: List attempts that can be resumed

The system SHALL expose a **read API** that returns **all attempts** in **`active`** or **`paused`** status, with enough metadata for a client to render a **resume list** without loading full question payloads. Each listed attempt SHALL include **stable attempt identifier**, **exam type code**, **status**, and **remaining active seconds** consistent with the same **server clock synchronization and expiry rules** applied when loading a single attempt for exam delivery.

#### Scenario: In-progress attempts appear in list

- **WHEN** the database contains attempts with status **`active`** or **`paused`**
- **THEN** the list response includes those attempts and excludes attempts with status **`submitted`** or **`expired`**

#### Scenario: Active attempt times stay authoritative

- **WHEN** an **`active`** attempt would expire under the same decay rules used for `GET` single-attempt retrieval
- **THEN** the list operation updates persisted attempt state accordingly (for example status becomes **`expired`** with zero remaining active seconds) so the client does not show it as resumable

### Requirement: Discover and open in-progress attempts from primary navigation

The web application SHALL surface **at least one** navigation path from the **home page** and from the **exam intro page** (for the configured practice exam) so a user can **see** in-progress attempts returned by the list API and **navigate** to the existing attempt route (`/attempt/[id]`) to continue. If no in-progress attempts exist, the UI SHALL omit or collapse this affordance without error.

#### Scenario: Home page shows continuable attempts

- **WHEN** the list API returns one or more resumable attempts
- **THEN** the home page presents them with links (or buttons) that route to `/attempt/[id]` for each attempt

#### Scenario: Exam intro surfaces same-exam continuations

- **WHEN** the user opens the exam intro page and the list API includes a resumable attempt for that exam type
- **THEN** the page presents a clear **continue** action that routes to that attempt’s `/attempt/[id]` without requiring the user to have bookmarked the URL
