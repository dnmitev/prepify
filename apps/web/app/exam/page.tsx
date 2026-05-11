"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet, apiSend, formatApiError } from "@/lib/api";
import { formatAttemptClock, type ResumableAttempt } from "@/lib/resumable-attempts";

export default function ExamIntroPage() {
  const router = useRouter();
  const [exam, setExam] = useState<
    | {
        exam: {
          code: string;
          name: string;
          durationMinutes: number;
          totalQuestions: number;
          unscoredCount: number;
          passingScaledScore: number;
        };
        domains: { code: string; name: string; weightPercent: number }[];
      }
    | undefined
  >();
  const [error, setError] = useState<string | undefined>();
  const [resumable, setResumable] = useState<ResumableAttempt[]>([]);

  useEffect(() => {
    apiGet<{ attempts: ResumableAttempt[] }>("/attempts")
      .then((d) => {
        setResumable(d.attempts.filter((a) => a.examTypeCode === "SAA-C03"));
      })
      .catch(() => {
        setResumable([]);
      });
  }, []);

  useEffect(() => {
    apiGet<{
      exam: {
        code: string;
        name: string;
        durationMinutes: number;
        totalQuestions: number;
        unscoredCount: number;
        passingScaledScore: number;
      };
      domains: { code: string; name: string; weightPercent: number }[];
    }>("/exams/SAA-C03")
      .then(setExam)
      .catch((e: unknown) => {
        setError(formatApiError(e));
      });
  }, []);

  async function start() {
    setError(undefined);
    if (resumable.length > 0) {
      const ok = window.confirm(
        "You already have an in-progress attempt for this exam. Start a new one anyway? Your previous attempt stays saved and you can still resume it from the home page or here.",
      );
      if (!ok) return;
    }
    try {
      const res = await apiSend<{ attemptId: string }>("/attempts", {
        method: "POST",
        body: JSON.stringify({ examTypeCode: "SAA-C03" }),
      });
      router.push(`/attempt/${res.attemptId}`);
    } catch (e: unknown) {
      setError(formatApiError(e));
    }
  }

  return (
    <div className="card">
      <h1>SAA-C03 practice</h1>
      {error ? <p style={{ color: "#fca5a5" }}>{error}</p> : null}
      {resumable.length > 0 ? (
        <section style={{ marginBottom: 20 }} aria-label="Continue in-progress attempt">
          <h2 style={{ fontSize: "1.1rem", marginBottom: 8 }}>In progress</h2>
          <ul>
            {resumable.map((a) => (
              <li key={a.id}>
                <Link href={`/attempt/${a.id}`} data-testid={`resume-attempt-${a.id}`}>
                  Continue ({a.status}) — {formatAttemptClock(a.remainingActiveSeconds)} active time left
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {!exam ? (
        <p>Loading exam metadata…</p>
      ) : (
        <>
          <p>{exam.exam.name}</p>
          <ul>
            <li>Duration (active time): {exam.exam.durationMinutes} minutes</li>
            <li>Questions per attempt: {exam.exam.totalQuestions}</li>
            <li>Unscored items (not revealed during the exam): {exam.exam.unscoredCount}</li>
            <li>Passing scaled score (estimate): {exam.exam.passingScaledScore} / 1000</li>
          </ul>
          <p style={{ opacity: 0.8 }}>
            Domains:{" "}
            {exam.domains.map((d) => `${d.name} (${String(d.weightPercent)}%)`).join(" · ")}
          </p>
          <p style={{ opacity: 0.75 }}>
            Reminder: scaled scoring here is an approximation for readiness tracking—not an official AWS
            result.
          </p>
          <button className="primary" type="button" onClick={() => void start()}>
            Begin attempt
          </button>
        </>
      )}
    </div>
  );
}
