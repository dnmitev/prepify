## Context

Prepify persists attempts in Postgres (`attempts.status` ∈ `active` | `paused` | `submitted` | `expired`). The web app starts attempts from `/exam` and navigates to `/attempt/[id]`, where `GET /attempts/:id` already returns full in-exam state and applies `syncAttemptClock` for active attempts. **Home (`/`) and the exam intro page do not surface in-flight attempts**, so users without the deep link cannot find them again. There is **no list endpoint** today.

## Goals / Non-Goals

**Goals:**

- Let users **discover** every attempt that can still be continued (`active` or `paused`).
- Provide **clear UI paths** (home and/or exam intro) to **open** `/attempt/[id]` and continue with existing pause/resume and reload behavior unchanged.
- Keep **remaining time** and **status** consistent with server rules already used by `GET /attempts/:id` (clock sync / expiry) for listed rows.

**Non-Goals:**

- Adding **authentication** or **per-user** attempt ownership (schema has no `userId` on attempts today); listing is scoped to the **current deployment’s data model** (implicit single-tenant / local-dev assumption unless/until identity exists).
- **Deleting** or **merging** duplicate in-progress attempts automatically.
- Changing **scoring**, **question assembly**, or **pause timer math**.

## Decisions

1. **API: dedicated read for resumable attempts**  
   - **Choice:** Add `GET /attempts` (or `GET /attempts?inProgress=1`) returning only rows with `status` ∈ `{ active, paused }`, joined with `exam_types` for `examTypeCode`.  
   - **Rationale:** Matches REST style next to `POST /attempts` and `GET /attempts/:id`; easy for web and tests.  
   - **Alternative considered:** GraphQL or embedding list in `GET /exams/:code` — heavier and couples catalog to session state.

2. **Clock sync for listed attempts**  
   - **Choice:** For each returned **active** row, reuse **`syncAttemptClock`** (same as detail route) so list reflects expiry transitions; **paused** rows unchanged by clock (per existing `applyActiveDecay` behavior).  
   - **Rationale:** Avoids showing stale “45 min left” when the attempt already expired on the server.  
   - **Alternative considered:** Raw DB fields without sync — simpler but misleading; rejected.

3. **Payload shape**  
   - **Choice:** Minimal fields: `id`, `examTypeCode`, `status`, `remainingActiveSeconds`, `createdAt` (and optionally `lastActivityAt` if useful for “last worked on”).  
   - **Rationale:** Enough for UI rows and sorting; full question payload stays on `GET /attempts/:id`.

4. **Multiple in-progress attempts**  
   - **Choice:** List **all** resumable attempts (sorted by `last_activity_at` or `created_at` descending). On `/exam`, if at least one exists for that exam code, show a **“Continue in-progress attempt”** block **above** “Begin attempt,” and optionally confirm before `POST /attempts` creates another.  
   - **Rationale:** Honest with current DB (multiple rows allowed); reduces accidental orphan attempts without hiding data.

5. **Web entry points**  
   - **Choice:** Add a **“In progress”** section on **home** linking to each row, and mirror or summarize on **`/exam`** for SAA-C03.  
   - **Rationale:** Covers users who land on `/` vs `/exam`.

## Risks / Trade-offs

- **[Risk] Listing calls `syncAttemptClock` per active attempt** → Mitigation: N is expected to be tiny in local/single-tenant use; if it grows, add a batched decay helper later.  
- **[Risk] No user isolation** exposes all in-progress attempts to any client with API access → Mitigation: document as **single-tenant / dev** limitation; gate future work on auth + `user_id` filtering.  
- **[Risk] UX clutter if many stale paused attempts** → Mitigation: sort by recency; optional later: archive or “abandon” action (out of scope).

## Migration Plan

- **Deploy order:** API route first, then web (web tolerates missing route with empty state during rollout only if feature-flagged; simplest is atomic PR).  
- **Rollback:** Remove route and UI; no schema migration required.  
- **Data:** No migration; uses existing `attempts` rows.

## Open Questions

- Should **“Begin attempt”** be disabled when an in-progress attempt exists, or only **warned**? (Recommend: warn + allow explicit second attempt until product policy tightens.)  
- Do we need **`last_activity_at`** in the list response for display (“Last active …”), or is remaining time + status enough for v1?
