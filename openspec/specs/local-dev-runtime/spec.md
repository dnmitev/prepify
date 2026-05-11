# local-dev-runtime Specification

## Purpose
TBD - created by archiving change local-dev-temporal-llm. Update Purpose after archive.
## Requirements
### Requirement: Docker Compose includes Temporal for local development

The repository’s primary **`docker-compose.yml`** SHALL include **Temporal** services sufficient for the worker and API to connect using **`TEMPORAL_ADDRESS`** on the host (default documented). Services SHALL start without requiring cloud credentials.

#### Scenario: Developer starts the stack

- **WHEN** a developer runs `docker compose up -d` from the repo root with documented defaults
- **THEN** Postgres (application DB) **and** Temporal are running such that `TEMPORAL_ADDRESS` can reach the Temporal frontend from the host on the documented port

### Requirement: Documented ports and dependencies

The **README** SHALL list host ports for Postgres, Temporal frontend gRPC (and optional Temporal Web UI if enabled), and SHALL describe dependency order (for example: databases before Temporal before worker).

#### Scenario: README lists Temporal connection string

- **WHEN** a developer reads the local setup section
- **THEN** they find the recommended **`TEMPORAL_ADDRESS`** value matching Compose port mappings and compatible with `@prepify/worker` defaults

### Requirement: Local stack does not require cloud LLM keys

Local setup documentation SHALL state that **question-generation smoke tests** MAY use a **local OpenAI-compatible** HTTP API (for example Ollama) and SHALL cross-reference env vars in `.env.example` for **`OPENAI_BASE_URL`**, model selection via **`LLM_ROLE_*`**, and optional placeholder keys.

#### Scenario: Env template mentions local LLM path

- **WHEN** a developer copies `.env.example` to `.env`
- **THEN** comments indicate how to point generation at a local model for testing without cloud keys

### Requirement: Docker Compose includes embedding-capable services for local development

The repository’s primary **`docker-compose.yml`** SHALL include **at least one service** suitable for **local embedding inference** (and MAY include an optional **small chat** service) so developers can run post-exam training features **without** cloud embedding keys when following README guidance. Services SHALL expose **documented host ports** and SHALL start together with existing **Postgres** and **Temporal** dependencies per documented order.

#### Scenario: Compose stack exposes embedding endpoint

- **WHEN** a developer runs `docker compose up -d` with documented defaults
- **THEN** an embedding-compatible HTTP endpoint is reachable from the host using the **documented URL** and port for worker configuration

#### Scenario: README documents model services

- **WHEN** a developer reads local setup for AI features
- **THEN** they find which Compose services provide **embeddings** (and optional **local chat**), how they map to **`LLM_ROLE_*`** or embedding env vars, and that **English-only** training is assumed

