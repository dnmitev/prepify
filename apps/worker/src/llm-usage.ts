import type { DbClient } from "@prepify/db";
import { llmUsageEvents } from "@prepify/db";

export async function recordLlmUsage(
  db: DbClient,
  params: {
    jobId?: string | null;
    environmentLabel: string;
    provider: string;
    model: string;
    role: string;
    workflowId: string;
    activityName: string;
    inputTokens: number;
    outputTokens: number;
  },
): Promise<void> {
  const total = params.inputTokens + params.outputTokens;
  await db.insert(llmUsageEvents).values({
    environmentLabel: params.environmentLabel,
    provider: params.provider,
    model: params.model,
    role: params.role,
    workflowId: params.workflowId,
    jobId: params.jobId ?? null,
    activityName: params.activityName,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    totalTokens: total,
  });
}
