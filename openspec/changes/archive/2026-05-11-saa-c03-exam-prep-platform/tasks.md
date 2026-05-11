## 1. Repository and TypeScript workspace

- [x] 1.1 Initialize monorepo layout (`apps/web`, `apps/api`, `apps/worker`, `packages/shared`, `packages/db`) with workspace tooling (pnpm/npm/yarn workspaces or Turborepo)
- [x] 1.2 Add root TypeScript config, ESLint/Prettier baseline, and strict compiler options shared across packages
- [x] 1.3 Add `.env.example` with placeholders only (`DATABASE_URL`, Temporal variables, optional LLM keys, **`APP_ENV`**) per `runtime-deployment` / `token-accounting` specs

## 2. Database schema and migrations

- [x] 2.1 Choose ORM (Drizzle or Prisma) and wire PostgreSQL connection via `DATABASE_URL`
- [x] 2.2 Model tables: `exam_types`, `domains`, `questions`, `question_options`, `attempts` (with **remaining_active_seconds**, **status**: active/paused/expired/submitted, pause timestamps), `attempt_items`, `responses`, optional `generation_jobs`, **`llm_usage_events`** (provider, model, role, input/output tokens, job/workflow id, environment label)
- [x] 2.3 Implement migrations and seed script for **SAA-C03** exam type, four domains with weights (30/26/24/20), duration default **120** minutes, 65 total / 15 unscored / pass **720**
- [x] 2.4 Add seed or import path from `SAA-C003/` markdown for curated sample items (respect licensing; structure only)

## 3. Core API (HTTP)

- [x] 3.1 Scaffold API service (Fastify/Express) with health route and structured logging
- [x] 3.2 Implement CRUD/read endpoints for exam catalog and question bank aligned with `exam-catalog` and `question-items` specs
- [x] 3.3 Implement validation rules for question structure (single vs multi-select correctness counts)
- [x] 3.4 Implement attempt lifecycle: start attempt (pick 65, hide 15 unscored), **pause**, **resume**, save answers, **get attempt by id** for reload recovery, submit or auto-close when **remaining active time** hits zero

## 4. Scoring engine

- [x] 4.1 Implement scored-vs-unscored filtering per attempt and raw correctness on **50** scored slots (works with **paused** attempts using persisted answers only)
- [x] 4.2 Implement configurable linear mapping to **100–1000** scaled approximation with pass at **≥ 720** for SAA-C03
- [x] 4.3 Expose results payload with scaled score, pass/fail, optional domain breakdown

## 5. Temporal and AI orchestration

- [x] 5.1 Add Temporal SDK to worker project; configure connection via env (`TEMPORAL_ADDRESS`, namespace, TLS flags as needed)
- [x] 5.2 Define **`LLMProvider`** + **role-based registry** (`summarization`, `question_generation`, etc.) loaded from config so **at least two distinct models** can be wired without code changes
- [x] 5.3 Implement generation workflow + activities: route steps to roles; validate structured output against schema; persist or record failure
- [x] 5.4 Implement optional validation workflow for editorial review or second-pass checks (possibly another role/model)
- [x] 5.5 Expose async API: enqueue job → return job id → poll status (no blocking UI dependency)
- [x] 5.6 After each LLM call, **persist token usage** rows (`token-accounting` spec) when the provider returns usage; attach **job id**, **role**, **`APP_ENV`/environment label**
- [x] 5.7 Add minimal **usage summary** query or admin endpoint: totals per job and per model role (protect or omit in public deployments via docs)

## 6. Frontend (Next.js)

- [x] 6.1 Scaffold Next.js app (App Router) with TypeScript and shared types from `packages/shared`
- [x] 6.2 Build exam selection and instructions screen for **SAA-C03** (show timing, item count, pass threshold; omit unscored labeling during exam)
- [x] 6.3 Build timed attempt UI: **remaining time from server**, single/multi-select controls, autosave of answers, **pause/resume controls**, route keyed by **`attempt_id`** so reload restores state after refetch
- [x] 6.4 Build results view: scaled score, pass/fail, disclaimer about approximation, domain breakdown chart/table
- [x] 6.5 Optional admin/contributor UI stub for triggering AI generation jobs and viewing status (no auth—restrict via deployment docs)

## 7. Docker and runtime deployment

- [x] 7.1 Author Dockerfiles for `api`, `worker`, and `web` without baked secrets
- [x] 7.2 Author `docker-compose.yml`: Postgres, Temporal (+ UI optional), api, worker, web; documented ports and dependency order
- [x] 7.3 Document local workflow: migrate → seed → compose up → smoke test web and API
- [x] 7.4 Add CI-friendly scripts (lint, **unit test**, **integration test** where DB available, **Playwright** optional profile, build images) without requiring cloud credentials

## 8. Automated testing

- [x] 8.1 Add **Vitest** (or Jest) at workspace level with shared config; `test` script per package for libraries (`packages/shared`, scoring helpers, validation)
- [x] 8.2 Unit tests: scoring approximation, question structure validation, unscored-slot logic; **timer math** for pause/resume (remaining active seconds)
- [x] 8.3 API integration tests: Postgres via **Testcontainers** or CI service container; migrate + seed minimal **SAA-C03** data; cover attempt start, **pause/resume**, answer save, reload **GET**, submit/score
- [x] 8.4 Add **Playwright** to `apps/web` (or monorepo root): `playwright.config.ts`, `PLAYWRIGHT_BASE_URL`, smoke/critical-path specs (instructions → attempt with **stable attempt URL** → pause/resume or reload recovery smoke)
- [x] 8.5 Document `npx playwright install` (or `pnpm exec playwright install`) and how to run E2E against `docker compose` URLs
- [x] 8.6 CI: run lint + unit + integration on PRs; run Playwright on PR or nightly—document chosen policy; never require live LLM keys

## 9. Bonus: client-side summarization (optional)

- [x] 9.1 Spike loading a small WASM/browser model (WebLLM-class) for optional explanations only (never authoritative grading)
- [x] 9.2 Gate feature behind explicit UI toggle and document memory/GPU expectations
