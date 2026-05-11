## 1. Docker Compose — Temporal

- [x] 1.1 Extend root `docker-compose.yml` with Temporal services per design **D1** (auto-setup + Temporal Postgres, or equivalent supported topology); wire `depends_on` and published **`7233`** (and optional UI port).
- [x] 1.2 Ensure existing **`postgres`** (prepify app DB) remains compatible; document both services in README.

## 2. Documentation and environment template

- [x] 2.1 Update **README** “Setup” / “Temporal” sections: single sequence `docker compose up -d` → migrate → seed → API / worker / web; list ports and **`TEMPORAL_ADDRESS`** (and optional UI URL).
- [x] 2.2 Update **`.env.example`** with Temporal defaults matching Compose, plus commented **local LLM** example (`OPENAI_BASE_URL`, `LLM_ROLE_QUESTION_GENERATION_PROVIDER`, model name, note on placeholder key).

## 3. Worker — local OpenAI-compatible generation

- [x] 3.1 Adjust `apps/worker` OpenAI HTTP path so **`OPENAI_API_KEY`** is optional when README “local LLM” conditions apply (per design **D3**); reject clearly when cloud endpoint requires a key.
- [x] 3.2 Add or extend a minimal unit/smoke test if feasible without live Ollama (for example URL parsing / guard helper).

## 4. Verification

- [x] 4.1 Run **`npm test --workspaces --if-present`** and **`npm run build --workspaces --if-present`** after changes; fix regressions.
- [x] 4.2 Manually verify (document in PR or README checklist): Compose up → worker connects → `POST /jobs/generate` succeeds with **`LLM_ROLE_QUESTION_GENERATION_PROVIDER=mock`**; optional second pass with local Ollama if available.
