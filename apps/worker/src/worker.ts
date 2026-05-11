import "./load-env.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const temporalAddress = process.env["TEMPORAL_ADDRESS"] ?? "localhost:7233";
const namespace = process.env["TEMPORAL_NAMESPACE"] ?? "default";
const taskQueue = process.env["TEMPORAL_TASK_QUEUE"] ?? "prepify-main";

const connection = await NativeConnection.connect({ address: temporalAddress });

const workflowsPath = path.join(__dirname, "workflows.ts");

const worker = await Worker.create({
  connection,
  namespace,
  taskQueue,
  workflowsPath,
  activities,
});

await worker.run();
