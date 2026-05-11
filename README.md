# Prepify

Monorepo for **Prepify** — timed certification practice with pause/resume, server-authoritative timers, optional Temporal-backed AI generation with token accounting, and Docker-friendly workflows.

## Prerequisites

- Node.js **20+** recommended (repo tested with Node **22**)
- npm **10+**
- Docker (optional, for Postgres via Compose)

## Setup

1. Copy env template:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Start Postgres:

```bash
docker compose up -d postgres
```

4. Migrate + seed:

```bash
export DATABASE_URL="postgresql://prepify:prepify@localhost:5432/prepify"
npm run db:migrate
npm run db:seed
```

5. Run API + Web (two terminals):

```bash
npm run dev -w @prepify/api
npm run dev -w @prepify/web
```

The UI calls the API from another origin (`localhost:3000` → `localhost:4000`). The API enables **CORS** for local Next.js by default (`CORS_ORIGIN` in `.env.example`). If you see **“Failed to fetch”** on `/exam`, the API is usually not running or Postgres is not migrated/seeded—keep both dev servers up and verify `curl http://localhost:4000/health`.

Defaults:

- API: `http://localhost:4000`
- Web: `http://localhost:3000` (`NEXT_PUBLIC_API_URL` points at API)

## Temporal (optional, for AI workflows)

The worker expects `TEMPORAL_ADDRESS` (see `.env.example`). For local development you can run Temporal using the official tooling (`temporal server start-dev`) or wire your own Compose stack; without Temporal, `/jobs/generate` returns **503** until configured.

Start worker:

```bash
npm run dev -w @prepify/worker
```

## Testing

```bash
npm test --workspaces --if-present
```

Playwright (requires running API + Web):

```bash
cd apps/web && npx playwright install
npm run test:e2e -w @prepify/web
```

The `exam-mapping` spec asserts stems/options match `SAA-C003` practice markdown (not generic placeholders). It **skips** if `http://127.0.0.1:4000/health` is unreachable. After changing the question bank, re-seed with `SEED_FORCE_QUESTION_BANK=1` (see `packages/db` seed).

## Docker image

The root `Dockerfile` builds all workspaces. Override `CMD` per service (`apps/api/dist/main.js`, `apps/worker/dist/worker.js`, `apps/web` via `next start`, etc.).

## Safety

Do **not** commit `.env` files or API keys — `.env.example` contains placeholders only.
