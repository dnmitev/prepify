import { eq } from "drizzle-orm";
import type { DbClient } from "@prepify/db";
import { attempts, examTypes } from "@prepify/db";
import {
  Client,
  Connection,
  WorkflowExecutionAlreadyStartedError,
  WorkflowIdReusePolicy,
} from "@temporalio/client";

export function isPostExamTrainingEnabled(): boolean {
  const v = process.env["POST_EXAM_TRAINING_ENABLED"]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export async function startPostExamTrainingWorkflowIfNeeded(
  db: DbClient,
  params: { attemptId: string; incorrectScoredCount: number; environmentLabel: string },
): Promise<{ started: boolean; workflowId?: string; reason?: string }> {
  if (!isPostExamTrainingEnabled()) {
    return { started: false, reason: "disabled" };
  }
  if (params.incorrectScoredCount < 1) {
    return { started: false, reason: "no_incorrect_scored_items" };
  }

  const temporalAddress = process.env["TEMPORAL_ADDRESS"]?.trim();
  if (!temporalAddress) {
    return { started: false, reason: "no_temporal_address" };
  }

  const attemptRow = (await db.select().from(attempts).where(eq(attempts.id, params.attemptId)))[0];
  if (!attemptRow) return { started: false, reason: "attempt_not_found" };
  const exam = (await db.select().from(examTypes).where(eq(examTypes.id, attemptRow.examTypeId)))[0];
  if (!exam) return { started: false, reason: "exam_not_found" };

  const workflowId = `post-exam-training-${params.attemptId}`;
  const taskQueue = process.env["TEMPORAL_TASK_QUEUE"] ?? "prepify-main";

  const connection = await Connection.connect({ address: temporalAddress });
  const client = new Client({
    connection,
    namespace: process.env["TEMPORAL_NAMESPACE"] ?? "default",
  });

  try {
    await client.workflow.start("postExamTrainingWorkflow", {
      taskQueue,
      workflowId,
      workflowIdReusePolicy: WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE_FAILED_ONLY,
      args: [
        {
          attemptId: params.attemptId,
          examTypeCode: exam.code,
          environmentLabel: params.environmentLabel,
        },
      ],
    });
    return { started: true, workflowId };
  } catch (e) {
    if (e instanceof WorkflowExecutionAlreadyStartedError) {
      return { started: false, workflowId, reason: "already_running" };
    }
    throw e;
  }
}
