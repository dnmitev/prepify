## Why

Self-directed certification prep needs repeatable, realistic practice: timed exams, faithful scoring rules, and high-quality explanations—not static PDFs alone. This change establishes a small full-stack platform focused first on **AWS Certified Solutions Architect – Associate (SAA-C03)** so you can drill domains, measure readiness, and optionally generate or enrich items with AI workflows without committing secrets to a public repository.

## What Changes

- Introduce a **greenfield** application with a **TypeScript backend**, **Next.js frontend**, and **PostgreSQL** (preferred over MongoDB for relational exam/session/scoring data and future analytics).
- Define an **exam catalog** seeded for **SAA-C03**: **65** questions per attempt, **15** unscored (unknown to the user), **scaled passing score 720/1000**; **duration configurable per exam type** (initial preset **120 minutes** as requested for practice; official guide lists **130 minutes**—both supported via configuration).
- Implement **multiple-choice and multiple-response** items: one or more correct options per question; clear per-option reasoning and references where applicable.
- Implement **timed practice sessions** with **pause and resume**, **server-authoritative** timer accounting (remaining time excludes paused intervals), and **durable attempt state** so a **browser reload** does not lose progress when the client re-fetches the in-flight attempt.
- Add an **AI-assisted pipeline** (Temporal-backed for durability and retries) to **generate** questions/answers/rationale and optionally **validate** or enrich content; **pluggable LLM providers** via configuration (API keys only via environment / secrets injection, never committed). Support **multiple configured models in one workflow** (e.g., a **lower-cost model** for lightweight summaries vs a **higher-quality model** for question generation), selected by **task role** in configuration.
- Record **LLM token usage** (“tokenomics”) for **development** and **production generation**: persist **input/output token counts** (and optional cost estimates) per call, per **model role**, and per **job/workflow** for analysis and budgets.
- Provide **Docker Compose** for local development (app + DB + Temporal stack as needed) and **container images** suitable for later deployment (e.g., container hosting or alongside a DB—not committing to Vercel specifics in scope).
- **No authentication** in this phase (single-user / open local/public demo assumptions documented).
- **Bonus path** (non-blocking): optional **in-browser small model** (e.g., WebLLM-class) for summaries or extra explanations on the client, keeping provider keys off the repo.
- Establish **automated testing**: **unit tests** for core logic (validation, scoring, pure helpers), **integration tests** for API + PostgreSQL where contracts matter, and **Playwright** end-to-end tests for critical UI flows; runnable locally and in CI **without** committing secrets.

## Capabilities

### New Capabilities

- `exam-catalog`: Register exam types (starting with SAA-C03), official constraints (question counts, unscored count, pass threshold, duration), and linkage to content domains; configurable presets without code changes.
- `question-items`: Store and serve assessment items (choices, one-or-many correct answers, explanations, domain tags); import/reference from repo docs under `SAA-C003/` as seed or editorial source.
- `practice-session`: Start/end timed attempts with **pause/resume**, **reload-safe** progress (server-side attempt + answers), enforce **remaining time** from server clock, record responses, compute scores using only scored slots, and surface results with breakdown by domain.
- `ai-orchestration`: Provider-agnostic generation and validation workflows using Temporal activities; **multi-model routing** by named roles (e.g., summarization vs generation); retries, timeouts, and idempotent job handling; no embedded API keys.
- `token-accounting`: Capture and persist **token usage** (and optional estimated cost) per provider/model/operation for dev observability and generation budgets; queryable aggregates per job and over time.
- `runtime-deployment`: Docker Compose for local runbooks, production-oriented Dockerfiles, environment-based configuration, `.env.example` without secrets, documentation for building images for generic container hosts.
- `automated-testing`: Unit tests for deterministic modules; database-backed API tests where needed; Playwright E2E for main UI journeys; CI wiring and documentation; no secrets in fixtures.

### Modified Capabilities

_(None — no existing capabilities in `openspec/specs/`.)_

## Impact

- **New codebase** (or expansion of bare repo): API surface, DB schema, Next.js UI, worker processes for Temporal.
- **New dependencies**: ORM/query layer for Postgres, Temporal SDK, LLM client SDKs behind a stable internal interface; optional reporting/export for **token usage** tables or logs.
- **Operational**: Local Compose stack; CI-friendly paths that do not require cloud credentials in the repository.
- **Quality**: Test runner(s) (e.g., Vitest), Playwright, optional coverage reporting; CI jobs for lint + unit + integration + documented E2E strategy.
- **Content**: `SAA-C003/SAA-C03-Exam-Guide.md` and practice Q&A samples inform seeds and editorial guidelines for the AI pipeline—not copied verbatim into committed secrets.
