## ADDED Requirements

### Requirement: Docker Compose includes Ollama for local chat models

The repository’s primary **`docker-compose.yml`** SHALL include an **Ollama** service (or equivalent documented **OpenAI-compatible chat** runner) that exposes the standard Ollama HTTP API on a **documented host port**, with a **persistent volume** for downloaded model weights, so local development can use **`OPENAI_BASE_URL`** pointed at Compose without installing Ollama on the host. The **README** SHALL document how to pull at least one recommended **Gemma 4**-compatible tag and at least one **DeepSeek**-family alternative tag (or where to find current tags), and SHALL note **port conflicts** if Ollama is already running on the host.

#### Scenario: Chat-capable runner is reachable after compose up

- **WHEN** a developer runs `docker compose up -d` with documented defaults
- **THEN** the Ollama service is running and the host can reach its HTTP API on the **documented port** for subsequent `ollama pull` and for worker/API **`OPENAI_BASE_URL`** configuration

#### Scenario: README covers Gemma 4 and DeepSeek-style models

- **WHEN** a developer reads the local LLM / Compose section
- **THEN** they find example **`ollama pull`** commands (or equivalent) for **Gemma 4** and a **DeepSeek**-style model, and guidance to align **`LLM_ROLE_*_MODEL`** with the pulled tag
