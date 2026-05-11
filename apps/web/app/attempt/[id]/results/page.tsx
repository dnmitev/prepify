"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiSend, formatApiError } from "@/lib/api";

type Outcome = {
  scaledScore: number;
  passed: boolean;
  rawCorrect: number;
  scoredCount: number;
  fractionCorrect: number;
  domainBreakdown: { code: string; correct: number; total: number; fraction: number }[];
  disclaimer: string;
};

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const attemptId = params.id;

  const [payload, setPayload] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | undefined>();
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    void (async () => {
      try {
        const res = await apiSend<Outcome>(`/attempts/${attemptId}/submit`, {
          method: "POST",
          body: "{}",
        });
        if (!activeRef.current) return;
        setPayload(res);
      } catch (e) {
        if (!activeRef.current) return;
        setError(formatApiError(e));
      }
    })();
    return () => {
      activeRef.current = false;
    };
  }, [attemptId]);

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
        </>
      ) : null}
      <p style={{ marginTop: 16 }}>
        <Link href="/exam">Practice again</Link>
      </p>
    </div>
  );
}
