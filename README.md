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

`.env.example` defaults to **Ollama** at `http://localhost:11434/v1` with **Gemma 4** for question generation (`gemma4:latest` — align `LLM_ROLE_QUESTION_GENERATION_MODEL` with `ollama list`). **By default** `docker compose up` does **not** start container Ollama—run **`ollama serve` on the host** and `ollama pull …` there (most reliable on macOS). To run Ollama inside Compose instead, use **`docker compose --profile ollama up -d`** (see below). Never bind **11434** twice (host + container). Use the commented fallback block in `.env.example` for **mock** generation when Ollama is unavailable.

2. Install dependencies:

```bash
npm install
```

3. Start **Postgres (app)** + **Temporal** + **Temporal Web UI** + optional **TEI** embeddings:

```bash
docker compose up -d
```

(Optional) Start **Ollama inside Docker** only if you are not using host **`ollama serve`**:

```bash
docker compose --profile ollama up -d
```

Compose exposes:

| Service               | Purpose                                                                      | Host port    |
| --------------------- | ---------------------------------------------------------------------------- | ------------ |
| `postgres`            | Application DB (`prepify`, **pgvector** enabled)                             | **5432**     |
| `ollama`              | **Optional** (`--profile ollama`): chat LLM at `/v1/chat/completions`        | **11434**    |
| `tei-embeddings`      | Local **OpenAI-compatible** `/v1/embeddings` (BGE small, **384-dim**)        | **8089**     |
| `temporal-postgresql` | Temporal metadata DB only (no host port — avoids clashing with app Postgres) | *(internal)* |
| `temporal`            | Temporal frontend (gRPC)                                                     | **7233**     |
| `temporal-ui`         | Temporal Web UI                                                              | **8080**     |

`tei-embeddings` is **linux/amd64**; on some ARM Macs it may be slow or fail to start—in that case keep **`LLM_ROLE_EMBEDDING_PROVIDER=mock`** for dev or point **`EMBEDDING_OPENAI_BASE_URL`** at a remote embeddings endpoint whose output dimension is **384** (matching the migration). The Compose file pins **TEI 1.7.x** because older **1.5** images could fail downloading models with **`relative URL without a base`** ([upstream issue](https://github.com/huggingface/text-embeddings-inference/issues/527)).

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

### Post-exam study guide (failed scored items)

When **`POST_EXAM_TRAINING_ENABLED=1`**, finishing an attempt with **at least one incorrect scored question** starts Temporal workflow **`postExamTrainingWorkflow`** (`post-exam-training-<attemptId>`). The worker writes **English** per-item summaries (small/cheap role), a consolidated **teaching** block (stronger role), **`pgvector`** embeddings (**384** dimensions, aligned with **BGE small** / Compose **TEI**), and exposes **`GET /attempts/:id/training`** for status and text. Default roles use **`mock`** so local dev works without extra LLM calls; set **`LLM_ROLE_*`** and **`EMBEDDING_OPENAI_BASE_URL`** (e.g. `http://localhost:8089/v1` for Compose **TEI**) for real models.

**Breaking change:** **`POST /jobs/generate`** now requires **`examTypeCode`** (a seeded catalog code such as **`SAA-C03`**). Requests that only send the legacy **`topic`** field will receive **400**. Optional fields: **`topicHint`** (narrowing focus), **`summarize`** (**boolean**, default **false** — set **`true`** to run the optional small-model summarization step before generation), **`questionCount`** (**integer**, default **1**, max **`GENERATION_MAX_QUESTIONS_PER_JOB`** or **50** — run one Temporal workflow that generates that many accepted questions sequentially).

Generated questions are embedded before persistence and compared against existing question embeddings in the same exam/domain. The worker uses **`LLM_ROLE_EMBEDDING_PROVIDER`**, **`LLM_ROLE_EMBEDDING_MODEL`**, and **`EMBEDDING_OPENAI_BASE_URL`** (or mock embeddings) for this dedupe gate. Defaults:

- **`QUESTION_DUPLICATE_HARD_THRESHOLD=0.94`** — candidate is skipped at or above this cosine similarity.
- **`QUESTION_DUPLICATE_REVIEW_THRESHOLD=0.88`** — accepted candidate is close enough to watch during tuning.
- **`QUESTION_GENERATION_MAX_ATTEMPT_MULTIPLIER=3`** — max candidate attempts is requested question count times this multiplier.

Poll **`GET /jobs/:id`** for **`completedQuestionCount`**, **`targetQuestionCount`**, **`candidateAttemptCount`**, **`duplicateSkippedCount`**, and **`generatedQuestionIds`**.

### Local LLM — Ollama + Gemma 4 (or DeepSeek)

Default `.env.example` targets **[Ollama](https://ollama.com/)**’s OpenAI-compatible API. Choose **one** way to run it:

**A — Ollama on the host (recommended on macOS)**  
Same as before Compose added a service: install [Ollama](https://ollama.com/), run **`ollama serve`**, then on the host:

```bash
ollama pull gemma4
# or: ollama pull gemma4:latest
```

Use **`OPENAI_BASE_URL=http://localhost:11434/v1`**. Do **not** start Compose Ollama on **11434** at the same time (`docker compose --profile ollama` would conflict—skip that profile).

**B — Ollama in Docker (`--profile ollama`)**  
If you want models only inside Docker:

```bash
docker compose --profile ollama up -d
docker compose exec ollama ollama pull gemma4
```

**DeepSeek-style model (example):** check [Ollama library](https://ollama.com/library), then e.g. `docker compose exec ollama ollama pull deepseek-r1:8b`.

If **`ollama pull` inside the container** fails with **`i/o timeout`** to `registry.ollama.ai` but **host** `ollama pull` works, traffic from Docker to the registry is blocked or misrouted (VPN, corporate firewall, Docker Desktop networking). **Use host Ollama (A)** or fix VPN/split-tunnel / Docker network settings. The Compose service sets **public DNS** (`8.8.8.8`, `1.1.1.1`) to reduce Docker DNS issues; it does not fix hard blocks.

**Common**  
1. Keep **`OPENAI_BASE_URL=http://localhost:11434/v1`** and **`LLM_ROLE_QUESTION_GENERATION_PROVIDER=openai`** when using Ollama.  
2. **`OPENAI_API_KEY`** may stay empty for localhost (see `packages/shared` `allowsMissingOpenAiApiKey`). For a non-loopback endpoint without auth, set **`LOCAL_LLM_SKIP_API_KEY=1`** (dev-only).

Summarization stays **`mock`** by default for speed; you can switch **`LLM_ROLE_SUMMARIZATION_PROVIDER`** to **`openai`** and the same **`OPENAI_BASE_URL`** if you want both steps on Ollama.

If Ollama is not running, switch generation to **mock** using the commented block at the bottom of `.env.example` so `/jobs/generate` still works.

### Manual checklist (local AI stack)

- `docker compose up -d` — app Postgres + Temporal + UI (+ **TEI**). For chat: **host** `ollama serve` + `ollama pull …`, **or** `docker compose --profile ollama up -d` + `docker compose exec ollama ollama pull …`.
- Temporal Web UI loads at `http://localhost:8080`.
- **`POST /jobs/generate`** with JSON body `{ "examTypeCode": "SAA-C03", "questionCount": 1 }` and **`LLM_ROLE_QUESTION_GENERATION_PROVIDER=mock`** returns `{ jobId, workflowId }` when testing without Ollama (requires API + Temporal + worker + migrated DB). Poll **`GET /jobs/:id`** for **`completedQuestionCount`**, **`targetQuestionCount`**, **`candidateAttemptCount`**, **`duplicateSkippedCount`**, and **`generatedQuestionIds`**.
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
