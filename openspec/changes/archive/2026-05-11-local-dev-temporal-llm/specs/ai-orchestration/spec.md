## ADDED Requirements

### Requirement: Local OpenAI-compatible backends for development

The system SHALL support configuring generation activities to call an **OpenAI-compatible HTTP API** hosted locally (for example **Ollama** exposing `/v1/chat/completions`) using **`OPENAI_BASE_URL`** (and related documented variables). When that endpoint does not enforce API-key authentication, the worker SHALL NOT fail solely due to a missing **`OPENAI_API_KEY`** if documented local-dev rules are satisfied (for example using an empty value or a documented placeholder).

#### Scenario: Local endpoint without cloud API key

- **WHEN** question generation is configured with provider **`openai`**, **`OPENAI_BASE_URL`** refers to a local OpenAI-compatible server that does not require a secret, and credentials follow README guidance
- **THEN** the generation activity completes successfully without requiring a paid cloud provider API key

#### Scenario: Clear failure when cloud provider expects a key

- **WHEN** **`OPENAI_BASE_URL`** targets a provider that requires authentication and no valid credential is supplied
- **THEN** the activity fails with an actionable error message that does not leak secrets
