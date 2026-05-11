"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend, formatApiError } from "@/lib/api";

type ExamRow = {
  code: string;
  name: string;
};

export default function AdminJobsPage() {
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [loadError, setLoadError] = useState<string>("");
  const [examCode, setExamCode] = useState("");
  const [topicHint, setTopicHint] = useState("");
  const [summarize, setSummarize] = useState(false);
  const [questionCount, setQuestionCount] = useState(1);
  const [result, setResult] = useState<string>("");

  useEffect(() => {
    void (async () => {
      try {
        const rows = await apiGet<ExamRow[]>("/exams");
        setExams(rows);
        setExamCode((prev) => prev || rows[0]?.code || "");
      } catch (e) {
        setLoadError(formatApiError(e));
      }
    })();
  }, []);

  async function enqueue() {
    try {
      const res = await apiSend<{
        jobId?: string;
        workflowId?: string;
        error?: string;
      }>("/jobs/generate", {
        method: "POST",
        body: JSON.stringify({
          examTypeCode: examCode,
          questionCount,
          ...(topicHint.trim() ? { topicHint: topicHint.trim() } : {}),
          summarize,
        }),
      });
      let snapshot: Record<string, unknown> | null = null;
      if (res.jobId) {
        try {
          snapshot = await apiGet<Record<string, unknown>>(`/jobs/${res.jobId}`);
        } catch {
          snapshot = null;
        }
      }
      setResult(JSON.stringify(snapshot ? { enqueue: res, job: snapshot } : res, null, 2));
    } catch (e) {
      setResult(formatApiError(e));
    }
  }

  return (
    <div className="card">
      <h1>AI generation jobs</h1>
      <p style={{ opacity: 0.8 }}>
        Local/dev helper — requires Temporal worker + <code>TEMPORAL_ADDRESS</code>.
      </p>
      {loadError ? (
        <p style={{ color: "salmon" }}>{loadError}</p>
      ) : null}
      <label style={{ display: "block", marginBottom: 8 }}>
        Exam{" "}
        <select
          value={examCode}
          onChange={(e) => setExamCode(e.target.value)}
          style={{ width: "100%", padding: 8 }}
          disabled={exams.length === 0}
        >
          {exams.length === 0 ? (
            <option value="">Loading exams…</option>
          ) : (
            exams.map((e) => (
              <option key={e.code} value={e.code}>
                {e.code} — {e.name}
              </option>
            ))
          )}
        </select>
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        Number of questions{" "}
        <input
          type="number"
          min={1}
          max={50}
          value={questionCount}
          onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
          style={{ width: "100%", padding: 8 }}
        />
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        Optional topic hint{" "}
        <input
          value={topicHint}
          onChange={(e) => setTopicHint(e.target.value)}
          placeholder="e.g. VPC security groups"
          style={{ width: "100%", padding: 8 }}
        />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={summarize}
          onChange={(e) => setSummarize(e.target.checked)}
        />
        Run summarization step (small model / mock) before generation
      </label>
      <button type="button" className="primary" onClick={() => void enqueue()} disabled={!examCode}>
        Enqueue generation workflow
      </button>
      <pre style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>{result}</pre>
    </div>
  );
}
