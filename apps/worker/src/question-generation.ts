import { allowsMissingOpenAiApiKey } from "@prepify/shared";

const JSON_CONTRACT = `Return a single JSON object with this shape:
{
  "stem": string (exam-style scenario, >= 40 chars),
  "format": "single" | "multiple",
  "domainCode": "SECURE" | "RESILIENT" | "PERF" | "COST",
  "options": [
    {
      "position": number (0-based, contiguous from 0),
      "text": string,
      "isCorrect": boolean,
      "explanation": string (for EVERY option; for correct answer(s) include detailed reasoning why that answer is right; for incorrect options briefly say why it is wrong or weaker)
    }
  ]
}
Rules:
- For "single", exactly one option has isCorrect true; for "multiple", two or more.
- Each correct option MUST have explanation with at least 20 characters of rationale (why it is the best answer).
- Provide four options (positions 0-3) unless multi-select needs more (still at least 4).`;

function mockRawPayload(topic: string, summary: string): unknown {
  const s = summary.trim() || "architecture trade-offs";
  return {
    stem:
      `A solutions architect is designing ${topic} for a regulated workload. Context from discovery: ${s.slice(0, 160)}. ` +
      `The design must minimize blast radius of credential misuse while preserving auditability. Which approach BEST satisfies these constraints?`,
    format: "single" as const,
    domainCode: "SECURE" as const,
    options: [
      {
        position: 0,
        text: "Store long-lived IAM user keys in the application config repository and rotate quarterly.",
        isCorrect: false,
        explanation:
          "Long-lived IAM users increase credential leakage risk and are discouraged when roles or federation exist.",
      },
      {
        position: 1,
        text: "Use IAM roles for workloads (EC2/Lambda) with least-privilege policies and AWS CloudTrail organization trails.",
        isCorrect: true,
        explanation:
          "IAM roles provide temporary credentials tied to the workload, reducing static secrets; least-privilege scopes blast radius; organization trails give centralized immutable audit across accounts.",
      },
      {
        position: 2,
        text: "Share one administrator password across teams via a spreadsheet stored in S3 with SSE-S3 encryption.",
        isCorrect: false,
        explanation:
          "Shared passwords break accountability and are poor practice compared with identities and roles.",
      },
      {
        position: 3,
        text: "Disable logging to reduce cost during peak traffic.",
        isCorrect: false,
        explanation:
          "Disabling logging weakens auditability and conflicts with compliance requirements in regulated scenarios.",
      },
    ],
  };
}

async function openAiRawPayload(params: {
  topic: string;
  summary: string;
  model: string;
}): Promise<{ raw: unknown; inputTokens: number; outputTokens: number }> {
  const base = process.env["OPENAI_BASE_URL"] ?? "https://api.openai.com/v1";
  const key = process.env["OPENAI_API_KEY"];
  const allowNoKey = allowsMissingOpenAiApiKey(base, process.env);
  if (!key?.trim() && !allowNoKey) {
    throw new Error(
      "OPENAI_API_KEY is required for this OPENAI_BASE_URL (use localhost / 127.0.0.1 base URL, set LOCAL_LLM_SKIP_API_KEY=1 for non-loopback dev servers, or provide a key)",
    );
  }
  const url = `${base.replace(/\/$/, "")}/chat/completions`;

  const body = {
    model: params.model,
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system" as const,
        content: `You write AWS certification-style questions for SAA-C03. ${JSON_CONTRACT}`,
      },
      {
        role: "user" as const,
        content: `Topic focus: ${params.topic}\nPrior summary context:\n${params.summary}\nProduce one question JSON only.`,
      },
    ],
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key?.trim()) {
    headers["Authorization"] = `Bearer ${key.trim()}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${t.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI response missing message content");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(content) as unknown;
  } catch {
    throw new Error("OpenAI returned non-JSON content");
  }

  const inputTokens = data.usage?.prompt_tokens ?? 0;
  const outputTokens = data.usage?.completion_tokens ?? 0;

  return { raw, inputTokens, outputTokens };
}

/** Calls summarization-sized mock or OpenAI for structured question JSON (validated by caller). */
export async function runQuestionGenerationModel(params: {
  topic: string;
  summary: string;
  provider: string;
  model: string;
}): Promise<{ raw: unknown; inputTokens: number; outputTokens: number }> {
  const p = params.provider.toLowerCase();
  if (p === "mock") {
    return {
      raw: mockRawPayload(params.topic, params.summary),
      inputTokens: 160,
      outputTokens: 520,
    };
  }
  if (p === "openai") {
    return openAiRawPayload({
      topic: params.topic,
      summary: params.summary,
      model: params.model,
    });
  }
  throw new Error(`Unsupported question_generation provider "${params.provider}". Use mock or openai.`);
}