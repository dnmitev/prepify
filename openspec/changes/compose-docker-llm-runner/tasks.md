## 1. Compose

- [ ] 1.1 Add **`ollama`** service to **`docker-compose.yml`** (`ollama/ollama` image, published port **11434**, named volume for model storage). Optionally add a brief comment linking to README for pulls and port conflicts.
- [ ] 1.2 Run **`docker compose config`** to validate YAML.

## 2. Documentation and env template

- [ ] 2.1 Extend **README** Compose port table and local LLM section: Compose-first path using **`http://localhost:11434/v1`**, **`docker compose exec ollama ollama pull gemma4`** (or **`gemma4:latest`**) and a **DeepSeek** example tag (e.g. **`deepseek-r1:8b`** — note to verify on Ollama library), and **host Ollama vs Compose** port conflict note.
- [ ] 2.2 Update **`.env.example`** comments to mention Compose Ollama as an alternative to host **`ollama serve`**.

## 3. Verification

- [ ] 3.1 Run **`npm test --workspaces --if-present`** if any code paths change; otherwise **`docker compose config`** is sufficient for a docs-only follow-up.
- [ ] 3.2 Mark tasks **`[x]`** after implementation commit(s); use **`/opsx:apply`** to implement this change.
