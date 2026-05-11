import type { IncorrectScoredItemPayload } from "@prepify/db";
import { allowsMissingOpenAiApiKey } from "@prepify/shared";

function itemPrompt(item: IncorrectScoredItemPayload): string {
  const opts = item.options
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((o) => `- [${String(o.position)}] ${o.text} (correct=${String(o.isCorrect)})`)
    .join("\n");
  return `Question stem:\n${item.stem}\n\nOptions:\n${opts}\n\nLearner selected positions: ${JSON.stringify(item.selectedPositions)}\n\nWrite a concise English summary (2–5 sentences) of what the learner misunderstood and which concepts to review. No markdown headings.`;
}

export async function runFailureSummarizationModel(params: {
  item: IncorrectScoredItemPayload;
  examTypeCode: string;
  provider: string;
  model: string;
}): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const p = params.provider.toLowerCase();
  if (p === "mock") {
    return {
      text: `Mock summary for question ${params.item.questionId.slice(0, 8)} on ${params.examTypeCode}: the learner picked a weaker option; review the scoring rubric and service constraints.`,
      inputTokens: 32,
      outputTokens: 28,
    };
  }
  if (p !== "openai") {
    throw new Error(`Unsupported failure_summarization provider "${params.provider}"`);
  }

  const base = (process.env["OPENAI_BASE_URL"] ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const key = process.env["OPENAI_API_KEY"];
  const allowNoKey = allowsMissingOpenAiApiKey(base, process.env);
  if (!key?.trim() && !allowNoKey) {
    throw new Error("OPENAI_API_KEY is required for failure summarization with this OPENAI_BASE_URL");
  }

  const url = `${base}/chat/completions`;
  const body = {
    model: params.model,
    temperature: 0.25,
    messages: [
      {
        role: "system" as const,
        content:
          "You write short English remediation notes for certification practice. Be factual and avoid naming internal IDs.",
      },
      { role: "user" as const, content: itemPrompt(params.item) },
    ],
  };
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key?.trim()) headers["Authorization"] = `Bearer ${key.trim()}`;

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Summarization HTTP ${String(res.status)}: ${t.slice(0, 500)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Summarization response missing content");
  return {
    text,
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
  };
}

export async function runPostExamTeachingModel(params: {
  examTypeCode: string;
  summaries: { questionId: string; text: string }[];
  provider: string;
  model: string;
}): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const p = params.provider.toLowerCase();
  const block = params.summaries.map((s) => `Q ${s.questionId}:\n${s.text}`).join("\n\n---\n\n");

  if (p === "mock") {
    const text =
      `Study guide (${params.examTypeCode}): You missed ${String(params.summaries.length)} scored item(s). ` +
      `Review AWS Well-Architected trade-offs, least privilege, and monitoring. ` +
      `For each mistake below, re-read the rationale and try a parallel drill question.\n\n` +
      block.slice(0, 8000);
    return { text, inputTokens: 120, outputTokens: 220 };
  }
  if (p !== "openai") {
    throw new Error(`Unsupported post_exam_teaching provider "${params.provider}"`);
  }

  const base = (process.env["OPENAI_BASE_URL"] ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const key = process.env["OPENAI_API_KEY"];
  const allowNoKey = allowsMissingOpenAiApiKey(base, process.env);
  if (!key?.trim() && !allowNoKey) {
    throw new Error("OPENAI_API_KEY is required for teaching step with this OPENAI_BASE_URL");
  }

  const url = `${base}/chat/completions`;
  const body = {
    model: params.model,
    temperature: 0.35,
    messages: [
      {
        role: "system" as const,
        content:
          "You produce English study notes for an AWS certification practice learner. Include: (1) a short overview, (2) bullet list of concepts to restudy, (3) one paragraph of actionable advice. Plain text only.",
      },
      {
        role: "user" as const,
        content: `Exam type: ${params.examTypeCode}\n\nPer-question summaries from a tutor model:\n\n${block}\n\nSynthesize into a cohesive study guide.`,
      },
    ],
  };
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key?.trim()) headers["Authorization"] = `Bearer ${key.trim()}`;

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Teaching HTTP ${String(res.status)}: ${t.slice(0, 500)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Teaching response missing content");
  return {
    text,
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
  };
}

export function chunkTeachingTextForEmbedding(text: string, maxChars = 1200): string[] {
  const normalized = text.trim();
  if (!normalized) return [];
  const paras = normalized.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  let cur = "";
  for (const p of paras) {
    const next = cur ? `${cur}\n\n${p}` : p;
    if (next.length > maxChars && cur) {
      out.push(cur);
      cur = p;
    } else {
      cur = next;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  if (out.length === 0) {
    for (let i = 0; i < normalized.length; i += maxChars) {
      out.push(normalized.slice(i, i + maxChars));
    }
  }
  return out;
}
