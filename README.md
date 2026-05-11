# Prepify

Monorepo for **Prepify** — timed certification practice with pause/resume, server-authoritative timers, optional Temporal-backed AI generation with token accounting, and Docker-friendly workflows.

## Prerequisites

- Node.js **20+** recommended (repo tested with Node **22**)
- npm **10+**
- Docker (optional, for Postgres + Temporal via Compose)

## Setup

1. Copy env template:

```bash
cp .env.example .env
```

`.env.example` defaults to **Ollama** at `http://localhost:11434/v1` with **Gemma 4** for question generation (`gemma4:latest` — align `LLM_ROLE_QUESTION_GENERATION_MODEL` with `ollama list`). Use the commented fallback block in `.env.example` for **mock** generation when Ollama is unavailable.

2. Install dependencies:

```bash
npm install
```

3. Start **Postgres (app)** + **Temporal** + **Temporal Web UI**:

```bash
docker compose up -d
```

Compose exposes:

| Service               | Purpose                                                                      | Host port    |
| --------------------- | ---------------------------------------------------------------------------- | ------------ |
| `postgres`            | Application DB (`prepify`)                                                   | **5432**     |
| `temporal-postgresql` | Temporal metadata DB only (no host port — avoids clashing with app Postgres) | *(internal)* |
| `temporal`            | Temporal frontend (gRPC)                                                     | **7233**     |
| `temporal-ui`         | Temporal Web UI                                                              | **8080**     |

4. Migrate + seed (application database):

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

**Environment files:** Put shared secrets in the **repository root** `.env`. Next.js reads `.env` next to the web app; **`@prepify/api`** and **`@prepify/worker`** load the **root** `.env` on startup so `TEMPORAL_ADDRESS`, `DATABASE_URL`, etc. apply when you run `npm run dev -w @prepify/api` / `worker` without exporting vars manually.

## Temporal + worker (AI generation jobs)

Set **`TEMPORAL_ADDRESS`** to match Compose (see `.env.example`, default `localhost:7233`). Start the worker:

```bash
npm run dev -w @prepify/worker
```

Without Temporal running, **`POST /jobs/generate`** returns **503**. Optional UI: **Temporal Web** at `http://localhost:8080`.

**Breaking change:** **`POST /jobs/generate`** now requires **`examTypeCode`** (a seeded catalog code such as **`SAA-C03`**). Requests that only send the legacy **`topic`** field will receive **400**. Optional fields: **`topicHint`** (narrowing focus), **`summarize`** (**boolean**, default **false** — set **`true`** to run the optional small-model summarization step before generation).

### Local LLM — Ollama + Gemma 4

Default `.env.example` targets **[Ollama](https://ollama.com/)**’s OpenAI-compatible API and **Gemma 4**:

1. Install/start Ollama and pull a Gemma 4 variant, for example:
   ```bash
   ollama pull gemma4
   ```
   Use the same tag in **`LLM_ROLE_QUESTION_GENERATION_MODEL`** as shown by `ollama list` (e.g. `gemma4:latest`, `gemma4:e4b`).
2. Keep **`OPENAI_BASE_URL=http://localhost:11434/v1`** and **`LLM_ROLE_QUESTION_GENERATION_PROVIDER=openai`**.
3. **`OPENAI_API_KEY`** may stay empty for localhost (see `packages/shared` `allowsMissingOpenAiApiKey`). For a non-loopback endpoint without auth, set **`LOCAL_LLM_SKIP_API_KEY=1`** (dev-only).

Summarization stays **`mock`** by default for speed; you can switch **`LLM_ROLE_SUMMARIZATION_PROVIDER`** to **`openai`** and the same **`OPENAI_BASE_URL`** if you want both steps on Ollama.

If Ollama is not running, switch generation to **mock** using the commented block at the bottom of `.env.example` so `/jobs/generate` still works.

### Manual checklist (local AI stack)

- `docker compose up -d` — app Postgres + Temporal + UI up.
- Temporal Web UI loads at `http://localhost:8080`.
- **`POST /jobs/generate`** with JSON body `{ "examTypeCode": "SAA-C03" }` and **`LLM_ROLE_QUESTION_GENERATION_PROVIDER=mock`** returns `{ jobId, workflowId }` when testing without Ollama (requires API + Temporal + worker + migrated DB).
- With Ollama + Gemma 4 configured, **`POST /jobs/generate`** exercises real JSON generation (quality depends on model and prompt).

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