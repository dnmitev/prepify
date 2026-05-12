import { allowsMissingOpenAiApiKey } from "@prepify/shared";

function mockEmbedding(seed: string, dimension: number): number[] {
  const out = new Array<number>(dimension);
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < out.length; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    out[i] = (h % 1000) / 1000 - 0.5;
  }
  const norm = Math.sqrt(out.reduce((s, v) => s + v * v, 0)) || 1;
  return out.map((v) => v / norm);
}

function assertExpectedDimension(vec: readonly number[], dimension: number, context: string): void {
  if (vec.length !== dimension) {
    throw new Error(`${context}: expected ${String(dimension)} dimensions, got ${String(vec.length)}`);
  }
}

/**
 * OpenAI-compatible `/v1/embeddings`. Uses EMBEDDING_OPENAI_BASE_URL or OPENAI_BASE_URL.
 */
export async function embedText(params: {
  text: string;
  provider: string;
  model: string;
  expectedDimension: number;
  context?: string;
}): Promise<{ embedding: number[]; inputTokens: number }> {
  const context = params.context ?? "embedding";
  const prov = params.provider.toLowerCase();
  if (prov === "mock") {
    const embedding = mockEmbedding(params.text, params.expectedDimension);
    assertExpectedDimension(embedding, params.expectedDimension, context);
    return { embedding, inputTokens: 4 };
  }

  const base = (
    process.env["EMBEDDING_OPENAI_BASE_URL"] ??
    process.env["OPENAI_BASE_URL"] ??
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const key = process.env["OPENAI_API_KEY"];
  const allowNoKey = allowsMissingOpenAiApiKey(base, process.env);
  if (!key?.trim() && !allowNoKey) {
    throw new Error(
      "OPENAI_API_KEY is required for embeddings with this base URL (or use a loopback URL / LLM_ROLE_EMBEDDING_PROVIDER=mock)",
    );
  }

  const url = `${base}/embeddings`;
  const body = { model: params.model, input: params.text };
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key?.trim()) headers["Authorization"] = `Bearer ${key.trim()}`;

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Embeddings HTTP ${String(res.status)}: ${t.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    data?: { embedding?: number[] }[];
    usage?: { prompt_tokens?: number; total_tokens?: number };
  };
  const embedding = data.data?.[0]?.embedding;
  if (!embedding?.length) {
    throw new Error("Embeddings response missing data[0].embedding");
  }
  assertExpectedDimension(embedding, params.expectedDimension, context);
  const inputTokens = data.usage?.prompt_tokens ?? data.usage?.total_tokens ?? 0;
  return { embedding, inputTokens };
}
