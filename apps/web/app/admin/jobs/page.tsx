"use client";

import { useState } from "react";
import { apiSend } from "@/lib/api";

export default function AdminJobsPage() {
  const [topic, setTopic] = useState("VPC security groups");
  const [result, setResult] = useState<string>("");

  async function enqueue() {
    try {
      const res = await apiSend<{ jobId?: string; workflowId?: string; error?: string }>(
        "/jobs/generate",
        {
          method: "POST",
          body: JSON.stringify({ topic }),
        },
      );
      setResult(JSON.stringify(res, null, 2));
    } catch (e) {
      setResult((e as Error).message);
    }
  }

  return (
    <div className="card">
      <h1>AI generation jobs</h1>
      <p style={{ opacity: 0.8 }}>
        Local/dev helper — requires Temporal worker + <code>TEMPORAL_ADDRESS</code>.
      </p>
      <label style={{ display: "block", marginBottom: 8 }}>
        Topic{" "}
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
      </label>
      <button type="button" className="primary" onClick={() => void enqueue()}>
        Enqueue generation workflow
      </button>
      <pre style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>{result}</pre>
    </div>
  );
}
