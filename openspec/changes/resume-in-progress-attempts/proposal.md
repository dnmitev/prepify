## Why

Learners can **start** a timed attempt and the product correctly supports **pause, resume, and reload** when they still have the `/attempt/:id` URL—but there is **no way to discover** an in-flight attempt from the home or exam flows. If they navigate away or open the app later without the link, the attempt effectively “disappears,” even though server state still holds it. This gap blocks a core expectation of practice-session continuity.

## What Changes

- **Expose in-progress attempts** via the API so the client can list attempts that are **`active`** or **`paused`** (not `submitted` / `expired`), with enough metadata to render a sensible row (e.g. exam code, status, remaining time snapshot or “sync on open”).
- **Web UI entry points** so users can **see** at least one in-progress attempt (or all, if multiple are allowed) and **navigate back** to `/attempt/:id` to continue—e.g. from the home page and/or the exam intro page before starting another attempt.
- **Optional guardrail**: clarify or enforce policy when **multiple** in-progress attempts exist for the same exam (surface all, or warn before starting another)—implementation detail in design; behavior must be intentional, not accidental duplication only in the DB.

## Capabilities

### New Capabilities

_(none — behavior extends existing practice session product rules.)_

### Modified Capabilities

- **`practice-session`**: Add requirements for **discoverability** and **resume entry points** (listing and linking to in-progress attempts) without changing the existing timer, pause/resume, or reload semantics already specified.

## Impact

- **`apps/api`**: New read endpoint(s) and/or query paths on `attempts` joined with `exam_types`; must stay consistent with `syncAttemptClock` / status rules used by `GET /attempts/:id`.
- **`apps/web`**: Home (`/`) and/or exam intro (`/exam`) UI to fetch and display resumable attempts with links to `/attempt/[id]`.
- **`packages/db`**: Possibly read-only query helpers or indexes only if needed for performance (likely unnecessary at current scale).
- **Tests**: Vitest for API listing behavior; Playwright or unit tests if listing is wired to critical navigation.
