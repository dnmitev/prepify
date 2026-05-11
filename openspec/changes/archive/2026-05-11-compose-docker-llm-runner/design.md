## Context

Prepify already documents **host-installed Ollama** for OpenAI-compatible chat (`OPENAI_BASE_URL`, `LLM_ROLE_*`). **Compose** already ships Postgres (pgvector), Temporal, TEI embeddings, and Temporal UI. Developers who prefer **everything in Docker** still need a **chat** runner for generation and optional teaching roles—without adopting a second, undocumented stack.

## Goals / Non-Goals

**Goals:**

- Add a **first-class Compose service** running **Ollama** (de facto “Docker model runner” for local OpenAI-compatible chat).
- Publish a **stable host port** and **named volume** for model weights so pulls survive restarts.
- Document **model pull** for **Gemma 4** (repo default today) and a **DeepSeek**-family option (e.g. `deepseek-r1` tags available in Ollama library) so teams can choose by policy or hardware.

**Non-Goals:**

- Baking a specific multi-GB model **into** the image (images stay small; pulls remain explicit).
- GPU orchestration as a mandatory part of the default file (optional compose override or README note only).
- Replacing TEI for embeddings (unchanged).

## Decisions

1. **Runner: Ollama in Compose**  
   **Rationale:** Matches existing env vars (`OPENAI_BASE_URL` → `/v1/chat/completions`), README mental model, and supports both Gemma 4 and DeepSeek catalog tags.  
   **Alternatives:** vLLM, llama.cpp server, LocalAI—heavier ops for this repo’s current “OpenAI-compatible URL” contract.

2. **Port `11434:11434`**  
   **Rationale:** Same as host Ollama docs so `.env` can stay `http://localhost:11434/v1`.  
   **Mitigation:** README warns that **host Ollama + Compose Ollama** cannot bind the same port—pick one or remap (e.g. `11435:11434`).

3. **No automatic `ollama pull` in `command:`**  
   **Rationale:** Pulls are large and model choice is user-specific; startup scripts that always pull harm CI and slow laptops.  
   **Mitigation:** README lists **copy-paste** `docker compose exec ollama ollama pull <tag>` after first `up`.

4. **Default documented tags**  
   - **Gemma 4:** `gemma4` or `gemma4:latest` (aligned with current `.env.example`).  
   - **DeepSeek:** e.g. `deepseek-r1:8b` or `deepseek-r1:latest` (verify current Ollama library names in README with “or equivalent” wording).

## Risks / Trade-offs

- **[Risk] Port clash with host Ollama** → **Mitigation:** Document; suggest stopping host daemon or remapping Compose port and adjusting `OPENAI_BASE_URL`.
- **[Risk] Large downloads / disk** → **Mitigation:** Volume mount; one-time pull; optional slimmer model tags.
- **[Risk] ARM vs x86 image behavior** → **Mitigation:** Use official multi-arch `ollama/ollama` image; note DeepSeek/Gemma sizes differ.

## Migration Plan

1. Land Compose + docs.  
2. Developers already on host Ollama: **either** stop host service and use Compose **or** keep host and **do not** start Compose Ollama (or remap port).  
3. Rollback: remove service and volume from compose; no DB migration.

## Open Questions

- Exact **DeepSeek** tag to recommend (library changes over time)—document as “check `ollama.com/library`”.
