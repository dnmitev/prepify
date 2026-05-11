## Why

Local LLM workflows (question generation, post-exam teaching, etc.) today assume **Ollama on the host** (`ollama serve`). That adds a manual install step and drift between machines. A **containerized model runner** in the primary Compose file gives one command to stand up Postgres, Temporal, embeddings, and a **chat-capable** model for OpenAI-compatible clients—without changing application code beyond configuration.

## What Changes

- Add an **`ollama`** (or equivalent documented) service to **`docker-compose.yml`** with a persistent volume and published API port for OpenAI-compatible **`/v1/chat/completions`**.
- Document **first-run model pull** for at least one recommended tag (**Gemma 4** and/or **DeepSeek**—implementer-chosen defaults with clear alternatives in README and `.env.example`).
- Update **README** port table and local LLM section so **`OPENAI_BASE_URL`** can target the Compose Ollama URL consistently with existing `LLM_ROLE_*` variables.

## Capabilities

### New Capabilities

- _(none — requirements extend existing local-dev-runtime.)_

### Modified Capabilities

- `local-dev-runtime`: Require that the primary Compose stack **includes a documented local chat model runner** (Ollama-compatible) suitable for Gemma 4 and/or DeepSeek-style models, with README guidance for pulling models and connecting the worker/API.

## Impact

- **`docker-compose.yml`**, **`README.md`**, **`.env.example`** (comments / default URLs). No API contract changes; optional port conflict note if developers also run host Ollama on the same port.
