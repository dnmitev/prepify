"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet, apiSend, formatApiError } from "@/lib/api";

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
            {exam.domains.map((d) => `${d.name} (${d.weightPercent}%)`).join(" · ")}
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
