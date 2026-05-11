"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiSend, formatApiError } from "@/lib/api";

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

function isMultipleChoice(format: string | undefined): boolean {
  return format?.trim().toLowerCase() === "multiple";
}

function optionLabel(options: { position: number; text: string }[], positions: number[]): string {
  if (positions.length === 0) return "—";
  const texts = positions
    .slice()
    .sort((a, b) => a - b)
    .map((p) => options.find((o) => o.position === p)?.text ?? String(p));
  return texts.join("; ");
}

export default function AttemptPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const attemptId = params.id;

  const [data, setData] = useState<AttemptPayload | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [cursor, setCursor] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const next = await apiGet<AttemptPayload>(`/attempts/${attemptId}`);
      setData(next);
      setError(undefined);
      if (next.attempt.status === "submitted" || next.attempt.status === "expired") {
        router.replace(`/attempt/${attemptId}/results`);
      }
    } catch (e) {
      setError(formatApiError(e));
    }
  }, [attemptId, router]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => {
      void refresh();
    }, 4000);
    return () => {
      window.clearInterval(id);
    };
  }, [refresh]);

  const q = useMemo(() => data?.questions.slice().sort((a, b) => a.position - b.position), [data]);
  const n = q?.length ?? 0;
  const reviewIndex = n;
  const isReview = n > 0 && cursor === reviewIndex;

  useEffect(() => {
    if (n === 0) return;
    setCursor((c) => Math.min(c, reviewIndex));
  }, [n, reviewIndex]);

  function mergeLocalSelection(questionId: string, positions: number[]) {
    setData((d) => {
      if (!d) return d;
      return {
        ...d,
        questions: d.questions.map((qu) =>
          qu.questionId === questionId ? { ...qu, selectedPositions: positions } : qu,
        ),
      };
    });
  }

  async function saveAnswer(questionId: string, selected: number[]) {
    mergeLocalSelection(questionId, selected);
    setError(undefined);
    try {
      await apiSend(`/attempts/${attemptId}/answers`, {
        method: "PATCH",
        body: JSON.stringify({ questionId, selectedPositions: selected }),
      });
      await refresh();
    } catch (e) {
      setError(formatApiError(e));
      await refresh();
    }
  }

  async function pause() {
    setError(undefined);
    try {
      await apiSend(`/attempts/${attemptId}/pause`, { method: "PATCH", body: "{}" });
      await refresh();
    } catch (e) {
      setError(formatApiError(e));
    }
  }

  async function resume() {
    setError(undefined);
    try {
      await apiSend(`/attempts/${attemptId}/resume`, { method: "PATCH", body: "{}" });
      await refresh();
    } catch (e) {
      setError(formatApiError(e));
    }
  }

  async function submit() {
    setSubmitError(undefined);
    setSubmitting(true);
    try {
      await apiSend<Record<string, unknown>>(`/attempts/${attemptId}/submit`, {
        method: "POST",
        body: "{}",
      });
      router.replace(`/attempt/${attemptId}/results`);
    } catch (e) {
      setSubmitError(formatApiError(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !data) {
    return (
      <div className="card">
        <p style={{ color: "#fca5a5" }}>{error}</p>
        <Link href="/exam">Back</Link>
      </div>
    );
  }

  if (!data) return <div className="card">Loading attempt…</div>;

  const activeQuestion = !isReview ? q?.[cursor] : undefined;
  const answeredCount = q?.filter((qu) => qu.selectedPositions.length > 0).length ?? 0;

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

      {error ? (
        <p style={{ color: "#fca5a5", marginTop: 12 }} role="alert">
          {error}
        </p>
      ) : null}

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => {
            void pause();
          }}
          disabled={data.attempt.status !== "active"}
        >
          Pause
        </button>
        <button
          type="button"
          onClick={() => {
            void resume();
          }}
          disabled={data.attempt.status !== "paused"}
        >
          Resume
        </button>
        <button
          type="button"
          className="primary"
          disabled={submitting || data.attempt.status === "submitted" || data.attempt.status === "expired"}
          onClick={() => {
            void submit();
          }}
        >
          {submitting ? "Submitting…" : "Submit exam"}
        </button>
        <Link href="/">Home</Link>
      </div>

      {submitError ? (
        <p style={{ color: "#fca5a5", marginTop: 12 }} role="alert">
          {submitError}
        </p>
      ) : null}

      {n === 0 ? (
        <p style={{ marginTop: 16 }}>No questions loaded.</p>
      ) : isReview ? (
        <section style={{ marginTop: 20 }} aria-label="Review before submit">
          <h2 style={{ marginTop: 0 }}>Review & submit</h2>
          <p style={{ opacity: 0.9 }}>
            You answered <strong>{String(answeredCount)}</strong> of <strong>{String(n)}</strong> questions.
            Submit to see your estimated score and domain breakdown.
          </p>
          <ol style={{ paddingLeft: 20, maxHeight: 280, overflowY: "auto" }}>
            {(q ?? []).map((qu, i) => (
              <li key={qu.questionId} style={{ marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setCursor(i);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#8ab4ff",
                    cursor: "pointer",
                    padding: 0,
                    textAlign: "left",
                    textDecoration: "underline",
                  }}
                >
                  Question {String(i + 1)}
                </button>
                {": "}
                {qu.selectedPositions.length > 0 ? (
                  <span>{optionLabel(qu.options, qu.selectedPositions)}</span>
                ) : (
                  <span style={{ opacity: 0.7 }}>Unanswered</span>
                )}
              </li>
            ))}
          </ol>
          <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                setCursor(Math.max(0, n - 1));
              }}
            >
              Back to last question
            </button>
            <button
              type="button"
              className="primary"
              disabled={submitting}
              onClick={() => {
                void submit();
              }}
            >
              {submitting ? "Submitting…" : "Submit and see results"}
            </button>
          </div>
        </section>
      ) : activeQuestion ? (
        <>
          <h2 style={{ marginTop: 16 }}>
            Question {String(cursor + 1)} / {String(n)}
          </h2>
          <p data-testid="question-stem">{activeQuestion.stem}</p>
          <p style={{ opacity: 0.75, fontSize: 14, marginTop: -8 }}>
            {isMultipleChoice(activeQuestion.format)
              ? "Select all answers that apply. You can choose more than one."
              : "Select one answer."}
          </p>
          <div style={{ display: "grid", gap: 8 }} role={isMultipleChoice(activeQuestion.format) ? "group" : undefined}>
            {activeQuestion.options.map((o) => {
              const multi = isMultipleChoice(activeQuestion.format);
              const selected = multi
                ? activeQuestion.selectedPositions.includes(o.position)
                : activeQuestion.selectedPositions[0] === o.position;
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
                    cursor: "pointer",
                  }}
                >
                  {multi ? (
                    <input
                      type="checkbox"
                      checked={selected}
                      aria-checked={selected}
                      onChange={(e) => {
                        const next = new Set(activeQuestion.selectedPositions);
                        if (e.target.checked) next.add(o.position);
                        else next.delete(o.position);
                        void saveAnswer(
                          activeQuestion.questionId,
                          [...next].sort((a, b) => a - b),
                        );
                      }}
                    />
                  ) : (
                    <input
                      type="radio"
                      name={`q-${activeQuestion.questionId}`}
                      value={String(o.position)}
                      checked={selected}
                      onChange={() => {
                        void saveAnswer(activeQuestion.questionId, [o.position]);
                      }}
                    />
                  )}
                  <span>{o.text}</span>
                </label>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, gap: 12 }}>
            <button
              type="button"
              onClick={() => {
                setCursor((c) => Math.max(0, c - 1));
              }}
              disabled={cursor === 0}
            >
              Previous
            </button>
            {cursor < n - 1 ? (
              <button
                type="button"
                onClick={() => {
                  setCursor((c) => c + 1);
                }}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setCursor(reviewIndex);
                }}
              >
                Review & submit
              </button>
            )}
          </div>
        </>
      ) : (
        <p style={{ marginTop: 16 }}>No questions loaded.</p>
      )}
    </div>
  );
}
