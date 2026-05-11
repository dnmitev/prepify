## 1. API — list resumable attempts

- [x] 1.1 Add a small exported helper in `apps/api/src/attempt-service.ts` (or colocated module) that queries `attempts` joined with `exam_types` for rows where `status` is `active` or `paused`, ordered by recency (`last_activity_at` or `created_at` descending). For each **active** row, call existing `syncAttemptClock` before building the response so expiry transitions match `GET /attempts/:id` behavior.
- [x] 1.2 Register `GET /attempts` on the Fastify app in `apps/api/src/server.ts` returning JSON: attempt `id`, `examTypeCode`, `status`, `remainingActiveSeconds`, and timestamps needed for UI (per `design.md`). Ensure route registration does not shadow `GET /attempts/:id` (define the collection route before the param route if required by Fastify).
- [x] 1.3 Add Vitest coverage in `apps/api` for the list route: seed or insert attempts (or use fixtures/integration patterns already used in `integration.test.ts`) asserting inclusion of `active`/`paused`, exclusion of `submitted`/`expired`, and that an `active` attempt past its window is transitioned to `expired` and omitted from the resumable list. Run `npm test -w @prepify/api`, then commit with a conventional message.

## 2. Web — discoverability UI

- [x] 2.1 On `apps/web/app/page.tsx`, fetch the new list endpoint via existing `apiGet` from `@/lib/api`, handle errors gracefully, and render an “In progress” section with links to `/attempt/[id]` when any rows exist; render nothing extra when the list is empty.
- [x] 2.2 On `apps/web/app/exam/page.tsx`, fetch the same list (or a filtered client-side view for `SAA-C03`) and show a prominent **Continue** path when a resumable attempt exists for that exam; keep **Begin attempt** behavior per `design.md` (warn or confirm if multiple / duplicate policy is chosen—match the decided UX in implementation).
- [x] 2.3 Run `npm run lint` and fix any new issues introduced by the UI changes.

## 3. End-to-end verification

- [x] 3.1 Extend or add a Playwright spec under `apps/web/e2e/` that starts an attempt, navigates home (or exam intro), and asserts the **resume** link or button is visible and navigates back to the same `/attempt/[id]`. Run `npm run test:e2e` when the full stack is available; if skipped locally, document the command in the PR description.
- [x] 3.2 Run `npm test --workspaces --if-present` and `npm run build --workspaces --if-present` from the repo root before merge; mark tasks complete in this file only after checks pass.
