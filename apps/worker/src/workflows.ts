import { proxyActivities, workflowInfo } from "@temporalio/workflow";
import type * as acts from "./activities.js";

const { summarizeTopic, generateQuestionItem } = proxyActivities<typeof acts>({
  startToCloseTimeout: "5 minutes",
  retry: { maximumAttempts: 4 },
});

const postExam = proxyActivities<typeof acts>({
  startToCloseTimeout: "15 minutes",
  retry: { maximumAttempts: 6 },
});

export async function generateQuestionWorkflow(input: {
  jobId: string;
  examTypeCode: string;
  topicHint?: string | null;
  summarize: boolean;
  questionCount: number;
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

  const n = Math.max(1, input.questionCount);
  for (let i = 0; i < n; i++) {
    await generateQuestionItem({
      jobId: input.jobId,
      examTypeCode: input.examTypeCode,
      topicHint: input.topicHint ?? null,
      summarize: input.summarize,
      summaryFromSummarization,
      environmentLabel: input.environmentLabel,
      workflowId: wf,
      questionCount: n,
      iterationIndex: i,
    });
  }
}

export async function postExamTrainingWorkflow(input: {
  attemptId: string;
  examTypeCode: string;
  environmentLabel: string;
}): Promise<void> {
  const wf = workflowInfo().workflowId;
  const prep = await postExam.postExamTrainingPrepareActivity({
    attemptId: input.attemptId,
    examTypeCode: input.examTypeCode,
    environmentLabel: input.environmentLabel,
    temporalWorkflowId: wf,
  });
  if (prep.skip) return;
  await postExam.postExamTrainingSummarizeActivity({
    runId: prep.runId,
    attemptId: input.attemptId,
    examTypeCode: input.examTypeCode,
    items: prep.items,
    environmentLabel: input.environmentLabel,
    workflowId: wf,
  });
  await postExam.postExamTrainingTeachActivity({
    runId: prep.runId,
    examTypeCode: input.examTypeCode,
    environmentLabel: input.environmentLabel,
    workflowId: wf,
  });
  await postExam.postExamTrainingEmbedActivity({
    runId: prep.runId,
    environmentLabel: input.environmentLabel,
    workflowId: wf,
  });
}
