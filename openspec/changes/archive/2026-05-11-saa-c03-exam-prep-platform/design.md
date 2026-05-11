## Context

The repository is a **bare public GitHub project**: there is no legacy system to migrate. Exam reference material already exists locally (`SAA-C003/SAA-C03-Exam-Guide.md`, practice questions/answers). The first vertical slice is **SAA-C03** with practice-oriented timing (**120 minutes** initial preset) while keeping **duration and thresholds configurable per exam type** so official **130-minute** scheduling can be modeled without code changes.

Constraints:

- **No authentication** in v1 (assume honest single-user / demo deployment).
- **No secrets in git**: API keys and DB passwords only via environment variables or runtime secret injection (Compose, K8s secrets, CI vars).
- **Multi-provider AI**: generation and validation must not lock into one vendor; **multiple models by role** (e.g., summarization vs generation) must be composable in one workflow.
- **Temporal** for long-running, retry-heavy AI steps (generation, batch validation) with clear worker boundaries.
- **Token accounting**: capture input/output tokens per LLM call for **development** and **production** usage visibility (“tokenomics”).

## Goals / Non-Goals

**Goals:**

- Ship a **coherent three-tier layout**: web UI, HTTP API + worker processes, PostgreSQL.
- Model **SAA-C03** exam rules: **65** items per attempt, **15** unscored and **not disclosed** during the attempt, **720/1000** pass threshold on the scaled result, **multiple choice** and **multiple response** formats.
- Provide **timed attempts** with **pause/resume**, **server-calculated remaining active time**, durability of answers and pause state, and **scoring** that excludes unscored items from the reported score.
- Implement **Docker Compose** for Postgres, API, web, Temporal (server + UI optional), and worker(s).
- Produce **OCI images** for services intended for generic container hosting (future deploy flexibility).
- Maintain **automated tests**: fast **unit** coverage for deterministic logic, targeted **integration** tests against PostgreSQL for API contracts, and **Playwright** E2E for critical UI flows; runnable in CI without cloud AI keys.

**Non-Goals:**

- Production deployment to **Vercel** or specific clouds (document portability only).
- **Authentication**, billing, or multi-tenant isolation.
- Perfect replication of AWS’s proprietary **scaled scoring** algorithm (the system SHALL document approximation unless/until a validated model exists).
- Mandatory **offline / WebLLM** path for core grading (bonus track only).

## Decisions

### D1 — PostgreSQL for primary persistence

**Choice:** Use **PostgreSQL** as the system of record.

**Rationale:** Relations between exam types, domains, questions, attempts, and responses fit a relational model; indexing and reporting by domain are first-class. MongoDB was considered but adds less benefit given structured scoring and joins.

**Alternatives:** MongoDB (flexible document shape for variable options) — rejected for v1 due to reporting and consistency preferences.

### D2 — TypeScript services with a dedicated API process and Temporal worker

**Choice:** **Next.js** for the web app; a **Node HTTP API** (e.g., Fastify or Express) in a separate package for clearer long-lived connections, shared libraries with a **Temporal worker** package; workers **do not** run inside serverless-only constraints.

**Rationale:** Temporal workers need a continuous process; splitting API/worker avoids Next.js deployment quirks when targeting containers. Shared TypeScript types and DB layer reduce duplication.

**Alternatives:** Next.js Route Handlers only — rejected for worker + Temporal separation; tRPC monolith — optional later but not required for v1.

### D3 — Exam attempt randomly designates unscored items (hidden)

**Choice:** For each attempt, the engine SHALL randomly designate **15** of **65** slots as **unscored** without revealing which to the user until submission (or per product decision: never reveal—only show final scored result).

**Rationale:** Mirrors AWS behavior where unscored items are indistinguishable during the exam.

**Alternatives:** Labeled practice mode showing unscored items — could be a future flag; out of scope for faithful mode.

### D4 — Scaled score mapping (approximation)

**Choice:** Implement a documented **linear mapping** from raw performance on **50 scored items** to a **100–1000** scale, with **pass at ≥ 720**. Tune constants in configuration.

**Rationale:** AWS does not publish the exact curve; a transparent approximation supports readiness tracking.

**Alternatives:** Raw percentage only — simpler but less familiar to candidates; keep both internal raw % and displayed scaled approximation.

### D5 — AI provider abstraction, multi-role models, and Temporal workflows

**Choice:** Define an internal **`LLMProvider` interface** parameterized by **named roles** (e.g., `summarization`, `question_generation`) resolved from configuration so **two or more models** can participate in one workflow—cheap/fast for summaries, stronger model for structured question JSON. Implement adapters (OpenAI-compatible, Anthropic, etc.). Orchestrate **GenerateQuestionWorkflow** and **ValidateItemWorkflow** via Temporal with retries, backoff, and activity heartbeats. Each activity records **token usage** into **`token-accounting`** storage when providers return usage fields.

**Rationale:** Optimizes cost/quality trade-offs per task; preserves flexible routing as providers evolve.

**Alternatives:** Single global model — simpler but poor tokenomics; hard-coded two-model split in code — rejected in favor of configuration-driven roles.

### D6 — Secrets and configuration

**Choice:** **`DATABASE_URL`**, **`TEMPORAL_ADDRESS`**, per-provider keys (`OPENAI_API_KEY`, etc.) read from environment; provide **`.env.example`** with placeholders only.

**Rationale:** Safe open-source hygiene.

### D7 — Docker Compose topology

**Choice:** Services: **`postgres`**, **`temporal`** (+ optional **`temporal-ui`**), **`api`**, **`worker`**, **`web`** (Next.js). Networks internal to Compose; expose web + API ports.

**Rationale:** Matches local dev and mirrors split processes for production images.

### D8 — Bonus: client-side small model (WebLLM-class)

**Choice:** Optional route — load a compact WASM/GPU model in-browser for **summaries** and **extra explanations** using **non-secret** weights; never replace authoritative grading.

**Rationale:** Adds offline-flavored help without putting keys in the repo.

### D9 — Automated testing strategy (Vitest + Playwright)

**Choice:** Use **Vitest** (or Jest) for **unit** tests colocated with packages; use **Playwright** from **`apps/web`** (or repo root) with **`PLAYWRIGHT_BASE_URL`** pointing at local Compose or preview URL. Add **HTTP + Postgres integration tests** via **Testcontainers** (Node) or CI **service container** Postgres plus migrations. **Mock LLM providers** in unit/integration tests; do not call real APIs in default CI.

**Rationale:** Vitest aligns with TypeScript ESM and fast feedback; Playwright is the de facto standard for Next.js E2E; DB-backed tests catch migration and query regressions.

**Alternatives:** Cypress — viable for E2E; Cypress chosen only if team standardizes on it. Pure mocked DB — faster but misses SQL/migration bugs.

### D10 — Pause/resume and reload-safe attempts

**Choice:** Persist attempts as **first-class server state**: **remaining active seconds**, **`paused` flag**, **pause/resume timestamps** (or accumulated paused duration), answers per item, and stable **`attempt_id`** referenced by the web client URL (e.g., `/attempt/[id]`). The UI SHALL poll or refetch server state after reload; **localStorage** MAY cache attempt id as convenience only—the server remains authoritative.

**Rationale:** Matches user expectation that closing the tab does not destroy progress; avoids trusting client clocks for scoring.

**Alternatives:** Client-only timer — rejected (reload breaks guarantees).

### D11 — Token usage persistence (“tokenomics”)

**Choice:** Append-only **usage events** table (or equivalent) with provider/model/role/token counts linked to **job/workflow id** and **`APP_ENV`** or explicit **`usage_environment`** label. Optionally compute **estimated cost** from configurable non-secret rate tables.

**Rationale:** Enables budgeting for question-generation pipelines and visibility during iterative development.

**Alternatives:** Log-only metrics — acceptable as supplement but insufficient for structured queries without parsing logs.

## Risks / Trade-offs

- **[Risk] Scaled score mismatch vs real AWS exam** → **Mitigation:** Label UI as “estimated scaled score”; expose raw %; document assumptions.
- **[Risk] AI hallucinations in generated items** → **Mitigation:** Human-review workflow flags; optional second-pass validation activity; seed curated items from `SAA-C003` docs.
- **[Risk] Temporal operational overhead locally** → **Mitigation:** Compose one-command up; document memory; optional simplified “inline AI” dev flag for contributors (future).
- **[Risk] No auth** → **Mitigation:** Document that deployments are untrusted-network unsafe; add auth later as separate capability.
- **[Risk] Playwright flakiness or slow CI** → **Mitigation:** Stable `data-testid` hooks, retry policy, optional split job for E2E; seed minimal fixtures.
- **[Risk] Pause/resume complexity or clock skew** → **Mitigation:** Server-only remaining time; unit tests for pause accumulation; integration tests for reload recovery.
- **[Risk] Incomplete token usage from some providers** → **Mitigation:** Store nulls with reason; estimate from tokenizer only when explicitly enabled; document provider capabilities.

## Migration Plan

**Greenfield:** Initial migration is **schema creation** (SQL migrations or ORM migration tool) applied on empty databases. Rollback is **redeploy previous image** + migrate down if needed. No user data migration in v1.

## Open Questions

- Whether to **ever reveal** which items were unscored post-submission (pedagogical vs exam-faithful).
- Exact **Temporal** topology for minimal laptops (embedded SQLite for Temporal dev is non-standard; likely full Temporal in Compose).
- Preferred **ORM** (Drizzle vs Prisma) — pick one during implementation for team velocity.
- Whether **Next.js** serves only UI or also reverse-proxies API in production (purely routing — decision at deploy time).
- How to handle **missing usage metadata** from a provider (omit row vs estimate vs zero) without misleading tokenomics dashboards.
