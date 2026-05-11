import { proxyActivities, workflowInfo } from "@temporalio/workflow";
import type * as acts from "./activities.js";

const { summarizeTopic, generateQuestionItem } = proxyActivities<typeof acts>({
  startToCloseTimeout: "5 minutes",
  retry: { maximumAttempts: 4 },
});

export async function generateQuestionWorkflow(input: {
  jobId: string;
  examTypeCode: string;
  topicHint?: string | null;
  summarize: boolean;
  environmentLabel: string;
}): Promise<void> {
  const wf = workflowInfo().workflowId;

  let summaryFromSummarization: string | null = null;
  if (input.summarize) {
    const topicForSummarize = input.topicHint?.trim() || input.examTypeCode;
    summaryFromSummarization = await summarizeTopic({
      jobId: input.jobId,
      topic: topicForSummarize,
      examTypeCode: input.examTypeCode,
      environmentLabel: input.environmentLabel,
      workflowId: wf,
    });
  }

  await generateQuestionItem({
    jobId: input.jobId,
    examTypeCode: input.examTypeCode,
    topicHint: input.topicHint ?? null,
    summarize: input.summarize,
    summaryFromSummarization,
    environmentLabel: input.environmentLabel,
    workflowId: wf,
  });
}
