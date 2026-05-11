import { allowsMissingOpenAiApiKey } from "@prepify/shared";

export type ExamDomainRow = { code: string; name: string; weightPercent: number };

function jsonContract(domainCodes: readonly string[]): string {
  const codesUnion = domainCodes.map((c) => `"${c}"`).join(" | ");
  return `Return a single JSON object with this shape:
{
  "stem": string (exam-style scenario, >= 40 chars),
  "format": "single" | "multiple",
  "domainCode": ${codesUnion},
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
- Use "single" when exactly one option has isCorrect true; use "multiple" only when two or more options have isCorrect true — never set format to "multiple" unless at least two options are marked correct.
- Each correct option MUST have explanation with at least 20 characters of rationale (why it is the best answer).
- Provide four options (positions 0-3) unless multi-select needs more (still at least 4).
- domainCode MUST be exactly one of: ${domainCodes.join(", ")}.`;
}

function mockRawPayload(params: {
  examTypeCode: string;
  examName: string;
  domains: ExamDomainRow[];
  topicHint: string | null;
  summaryBlock: string | null;
  iterationIndex: number;
  questionCount: number;
}): unknown {
  let focus = params.topicHint?.trim() ?? "";
  if (!focus && params.summaryBlock?.trim()) {
    focus = params.summaryBlock.trim().slice(0, 120);
  }
  if (!focus) focus = "architecture trade-offs";
  const primaryDomain =
    params.domains[params.iterationIndex % params.domains.length]?.code ?? "SECURE";
  const batchHint =
    params.questionCount > 1 ?
      ` Variation ${params.iterationIndex + 1} of ${params.questionCount}: use a distinct scenario from other batch items.`
    : "";
  return {
    stem:
      `A solutions architect is designing a workload for ${params.examName} (${params.examTypeCode}). ` +
      `Scenario focus: ${focus}. The design must minimize blast radius of credential misuse while preserving auditability. Which approach BEST satisfies these constraints?` +
      batchHint,
    format: "single" as const,
    domainCode: primaryDomain,
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

function userPromptContent(params: {
  examTypeCode: string;
  examName: string;
  domains: ExamDomainRow[];
  topicHint: string | null;
  summaryBlock: string | null;
  iterationIndex: number;
  questionCount: number;
}): string {
  const domainLines = params.domains
    .map((d) => `- ${d.code}: ${d.name} (${d.weightPercent}% weight)`)
    .join("\n");
  const hintLine =
    params.topicHint?.trim() ?
      `Optional scenario focus (narrowing hint): ${params.topicHint.trim()}`
    : "Optional scenario focus (narrowing hint): (none)";
  const summarySection =
    params.summaryBlock?.trim() ?
      `Prior summarized research notes:\n${params.summaryBlock.trim()}`
    : "No separate summarization step was run — rely on the exam blueprint and optional hint above.";
  const batchLine =
    params.questionCount > 1 ?
      `\nBatch position: question ${params.iterationIndex + 1} of ${params.questionCount}. Produce a scenario clearly different from prior items in this batch (different service, constraint, or failure mode).\n`
    : "";
  return `Exam: ${params.examName} (${params.examTypeCode})

Domains (pick domainCode from this list only):
${domainLines}

${hintLine}

${summarySection}
${batchLine}
Produce one question JSON object only. Prefer "single" unless the scenario clearly requires selecting multiple answers; if you use "multiple", mark at least two options isCorrect true.`;
}

async function openAiRawPayload(params: {
  examTypeCode: string;
  examName: string;
  domains: ExamDomainRow[];
  topicHint: string | null;
  summaryBlock: string | null;
  iterationIndex: number;
  questionCount: number;
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

  const domainCodes = params.domains.map((d) => d.code);
  const body = {
    model: params.model,
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system" as const,
        content: `You write certification-style multiple-choice questions aligned to the exam blueprint. ${jsonContract(domainCodes)}`,
      },
      {
        role: "user" as const,
        content: userPromptContent(params),
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

/** Calls mock or OpenAI-compatible endpoint for structured question JSON (validated by caller). */
export async function runQuestionGenerationModel(params: {
  examTypeCode: string;
  examName: string;
  domains: ExamDomainRow[];
  topicHint: string | null;
  /** Non-null when summarization ran; omitted content when summarization was skipped. */
  summaryBlock: string | null;
  provider: string;
  model: string;
  iterationIndex?: number;
  questionCount?: number;
}): Promise<{ raw: unknown; inputTokens: number; outputTokens: number }> {
  const iterationIndex = params.iterationIndex ?? 0;
  const questionCount = params.questionCount ?? 1;
  const p = params.provider.toLowerCase();
  if (p === "mock") {
    return {
      raw: mockRawPayload({
        examTypeCode: params.examTypeCode,
        examName: params.examName,
        domains: params.domains,
        topicHint: params.topicHint,
        summaryBlock: params.summaryBlock,
        iterationIndex,
        questionCount,
      }),
      inputTokens: 160,
      outputTokens: 520,
    };
  }
  if (p === "openai") {
    return openAiRawPayload({
      examTypeCode: params.examTypeCode,
      examName: params.examName,
      domains: params.domains,
      topicHint: params.topicHint,
      summaryBlock: params.summaryBlock,
      iterationIndex,
      questionCount,
      model: params.model,
    });
  }
  throw new Error(`Unsupported question_generation provider "${params.provider}". Use mock or openai.`);
}
