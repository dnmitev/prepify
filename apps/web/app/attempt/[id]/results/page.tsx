"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiBase, apiSend, formatApiError } from "@/lib/api";

type Outcome = {
  scaledScore: number;
  passed: boolean;
  rawCorrect: number;
  scoredCount: number;
  fractionCorrect: number;
  domainBreakdown: { code: string; correct: number; total: number; fraction: number }[];
  disclaimer: string;
};

type TrainingPayload = {
  status: string;
  teachingText: string | null;
  embeddingModel: string | null;
  embeddingDim: number | null;
  errorMessage: string | null;
  updatedAt: string;
};

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const attemptId = params.id;

  const [payload, setPayload] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [training, setTraining] = useState<TrainingPayload | null | "absent">(null);
  const [trainingError, setTrainingError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiSend<Outcome>(`/attempts/${attemptId}/submit`, {
          method: "POST",
          body: "{}",
        });
        if (cancelled) return;
        setPayload(res);
      } catch (e) {
        if (cancelled) return;
        setError(formatApiError(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  useEffect(() => {
    if (!payload) return;
    const incorrect = payload.scoredCount - payload.rawCorrect;
    if (incorrect <= 0) return;

    let cancelled = false;
    let tries = 0;
    const maxTries = 20;

    void (async () => {
      while (!cancelled && tries < maxTries) {
        tries += 1;
        try {
          const res = await fetch(`${apiBase()}/attempts/${attemptId}/training`, { cache: "no-store" });
          if (cancelled) return;
          if (res.status === 404) {
            setTraining("absent");
            return;
          }
          if (!res.ok) {
            setTrainingError(await res.text());
            return;
          }
          const data = (await res.json()) as TrainingPayload;
          if (cancelled) return;
          setTraining(data);
          if (data.status === "succeeded" || data.status === "failed") {
            return;
          }
        } catch (e) {
          if (cancelled) return;
          setTrainingError(formatApiError(e));
          return;
        }
        await new Promise((r) => setTimeout(r, 4000));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attemptId, payload]);

  return (
    <div className="card">
      <h1>Results</h1>
      {error ? <p style={{ color: "#fca5a5" }}>{error}</p> : null}
      {!payload && !error ? (
        <p>Scoring your attempt…</p>
      ) : null}
      {payload ? (
        <>
          <p>
            Estimated scaled score: <strong>{payload.scaledScore}</strong>
          </p>
          <p>Pass (estimate): {payload.passed ? "Yes" : "No"}</p>
          <p style={{ opacity: 0.85 }}>
            Raw scored accuracy: {payload.rawCorrect} / {payload.scoredCount} (
            {Math.round(payload.fractionCorrect * 100)}%)
          </p>
          <p style={{ opacity: 0.75 }}>{payload.disclaimer}</p>
          <h3>Domains</h3>
          <table width="100%" cellPadding={6}>
            <thead>
              <tr>
                <th align="left">Domain</th>
                <th align="left">Correct</th>
              </tr>
            </thead>
            <tbody>
              {payload.domainBreakdown.map((d) => (
                <tr key={d.code}>
                  <td>{d.code}</td>
                  <td>
                    {d.correct}/{d.total} ({Math.round(d.fraction * 100)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payload.scoredCount - payload.rawCorrect > 0 ? (
            <section style={{ marginTop: 24 }} aria-label="Study guide" data-testid="study-guide">
              <h3>Study guide</h3>
              {training === null ? (
                <p style={{ opacity: 0.85 }}>Checking for personalized study notes…</p>
              ) : null}
              {training === "absent" ? (
                <p style={{ opacity: 0.85 }}>
                  No study guide is registered for this attempt yet. If training is enabled, ensure Temporal and the
                  worker are running and try refreshing this page.
                </p>
              ) : null}
              {training && training !== "absent" && training.status === "failed" ? (
                <p style={{ color: "#fca5a5" }}>{training.errorMessage ?? "Training failed"}</p>
              ) : null}
              {training &&
              training !== "absent" &&
              training.status !== "succeeded" &&
              training.status !== "failed" ? (
                <p style={{ opacity: 0.85 }}>
                  Status: <strong>{training.status}</strong> (generating English summaries and embeddings…)
                </p>
              ) : null}
              {training && training !== "absent" && training.status === "succeeded" && training.teachingText ? (
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    background: "rgba(0,0,0,0.25)",
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                >
                  {training.teachingText}
                </pre>
              ) : null}
              {trainingError ? <p style={{ color: "#fca5a5" }}>{trainingError}</p> : null}
            </section>
          ) : null}
        </>
      ) : null}
      <p style={{ marginTop: 16 }}>
        <Link href="/exam">Practice again</Link>
      </p>
    </div>
  );
}
