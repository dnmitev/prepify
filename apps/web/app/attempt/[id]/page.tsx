"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "@/lib/api";

type AttemptPayload = {
  attempt: {
    id: string;
    status: string;
    remainingActiveSeconds: number;
    examTypeCode?: string;
    scaledScore?: number | null;
    passed?: boolean | null;
  };
  questions: {
    position: number;
    questionId: string;
    stem: string;
    format: string;
    options: { position: number; text: string }[];
    selectedPositions: number[];
  }[];
};

export default function AttemptPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const attemptId = params.id;

  const [data, setData] = useState<AttemptPayload | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [cursor, setCursor] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const next = await apiGet<AttemptPayload>(`/attempts/${attemptId}`);
      setData(next);
      if (next.attempt.status === "submitted" || next.attempt.status === "expired") {
        router.replace(`/attempt/${attemptId}/results`);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, [attemptId, router]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 4000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const q = useMemo(() => data?.questions.slice().sort((a, b) => a.position - b.position), [data]);

  async function saveAnswer(questionId: string, selected: number[]) {
    await apiSend(`/attempts/${attemptId}/answers`, {
      method: "PATCH",
      body: JSON.stringify({ questionId, selectedPositions: selected }),
    });
    await refresh();
  }

  async function pause() {
    await apiSend(`/attempts/${attemptId}/pause`, { method: "PATCH", body: "{}" });
    await refresh();
  }

  async function resume() {
    await apiSend(`/attempts/${attemptId}/resume`, { method: "PATCH", body: "{}" });
    await refresh();
  }

  async function submit() {
    const res = await apiSend<Record<string, unknown>>(`/attempts/${attemptId}/submit`, {
      method: "POST",
      body: "{}",
    });
    router.replace(`/attempt/${attemptId}/results`);
    void res;
  }

  if (error) {
    return (
      <div className="card">
        <p style={{ color: "#fca5a5" }}>{error}</p>
        <Link href="/exam">Back</Link>
      </div>
    );
  }

  if (!data) return <div className="card">Loading attempt…</div>;

  const activeQuestion = q?.[cursor];

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <strong>{data.attempt.examTypeCode}</strong> ·{" "}
          <span data-testid="attempt-status">{data.attempt.status}</span>
        </div>
        <div data-testid="remaining-time">
          Remaining: {Math.floor(data.attempt.remainingActiveSeconds / 60)}:
          {String(data.attempt.remainingActiveSeconds % 60).padStart(2, "0")}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={() => void pause()} disabled={data.attempt.status !== "active"}>
          Pause
        </button>
        <button type="button" onClick={() => void resume()} disabled={data.attempt.status !== "paused"}>
          Resume
        </button>
        <button type="button" className="primary" onClick={() => void submit()}>
          Submit exam
        </button>
        <Link href="/">Home</Link>
      </div>

      {!activeQuestion ? (
        <p>No questions loaded.</p>
      ) : (
        <>
          <h2 style={{ marginTop: 16 }}>
            Question {cursor + 1} / {q?.length ?? 0}
          </h2>
          <p data-testid="question-stem">{activeQuestion.stem}</p>
          <div style={{ display: "grid", gap: 8 }}>
            {activeQuestion.options.map((o) => {
              const selected = activeQuestion.selectedPositions.includes(o.position);
              const multi = activeQuestion.format === "multiple";
              return (
                <label
                  key={o.position}
                  style={{
                    border: "1px solid rgba(255,255,255,0.14)",
                    borderRadius: 10,
                    padding: 10,
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  {multi ? (
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => {
                        const next = new Set(activeQuestion.selectedPositions);
                        if (e.target.checked) next.add(o.position);
                        else next.delete(o.position);
                        void saveAnswer(activeQuestion.questionId, [...next].sort((a, b) => a - b));
                      }}
                    />
                  ) : (
                    <input
                      type="radio"
                      checked={selected}
                      onChange={() => void saveAnswer(activeQuestion.questionId, [o.position])}
                      name={`q-${activeQuestion.questionId}`}
                    />
                  )}
                  <span>{o.text}</span>
                </label>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <button type="button" onClick={() => setCursor((c) => Math.max(0, c - 1))} disabled={cursor === 0}>
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCursor((c) => Math.min((q?.length ?? 1) - 1, c + 1))}
              disabled={cursor >= (q?.length ?? 1) - 1}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
