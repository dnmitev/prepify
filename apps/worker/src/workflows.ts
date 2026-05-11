import { proxyActivities, workflowInfo } from "@temporalio/workflow";
import type * as acts from "./activities.js";

const { summarizeTopic, generateQuestionItem } = proxyActivities<typeof acts>({
  startToCloseTimeout: "5 minutes",
  retry: { maximumAttempts: 4 },
});

export async function generateQuestionWorkflow(input: {
  jobId: string;
  topic: string;
  environmentLabel: string;
}): Promise<void> {
  const wf = workflowInfo().workflowId;
  const summary = await summarizeTopic({ ...input, workflowId: wf });
  await generateQuestionItem({ ...input, summary, workflowId: wf });
}
