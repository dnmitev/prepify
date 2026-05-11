"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiSend } from "@/lib/api";

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiSend<Outcome>(`/attempts/${attemptId}/submit`, {
          method: "POST",
          body: "{}",
        });
        if (!cancelled) setPayload(res);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  return (
    <div className="card">
      <h1>Results</h1>
      {error ? <p style={{ color: "#fca5a5" }}>{error}</p> : null}
      {!payload ? (
        <p>Loading…</p>
      ) : (
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
      )}
      <p style={{ marginTop: 16 }}>
        <Link href="/exam">Practice again</Link>
      </p>
    </div>
  );
}
