## ADDED Requirements

### Requirement: Docker Compose includes embedding-capable services for local development

The repository’s primary **`docker-compose.yml`** SHALL include **at least one service** suitable for **local embedding inference** (and MAY include an optional **small chat** service) so developers can run post-exam training features **without** cloud embedding keys when following README guidance. Services SHALL expose **documented host ports** and SHALL start together with existing **Postgres** and **Temporal** dependencies per documented order.

#### Scenario: Compose stack exposes embedding endpoint

- **WHEN** a developer runs `docker compose up -d` with documented defaults
- **THEN** an embedding-compatible HTTP endpoint is reachable from the host using the **documented URL** and port for worker configuration

#### Scenario: README documents model services

- **WHEN** a developer reads local setup for AI features
- **THEN** they find which Compose services provide **embeddings** (and optional **local chat**), how they map to **`LLM_ROLE_*`** or embedding env vars, and that **English-only** training is assumed
