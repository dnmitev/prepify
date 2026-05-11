import Link from "next/link";
import { apiGet } from "@/lib/api";
import { formatAttemptClock, type ResumableAttempt } from "@/lib/resumable-attempts";

export const dynamic = "force-dynamic";

async function loadResumableAttempts(): Promise<ResumableAttempt[]> {
  try {
    const data = await apiGet<{ attempts: ResumableAttempt[] }>("/attempts");
    return data.attempts;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const resumable = await loadResumableAttempts();

  return (
    <div className="card">
      <h1>Prepify</h1>
      <p>Practice exams with timed attempts, pause/resume, and estimated scaled scoring.</p>
      {resumable.length > 0 ? (
        <section style={{ marginBottom: 20 }} aria-label="In-progress attempts">
          <h2 style={{ fontSize: "1.1rem", marginBottom: 8 }}>In progress</h2>
          <ul>
            {resumable.map((a) => (
              <li key={a.id}>
                <Link href={`/attempt/${a.id}`} data-testid={`resume-attempt-${a.id}`}>
                  Continue {a.examTypeCode} ({a.status}) — {formatAttemptClock(a.remainingActiveSeconds)} left
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <ul>
        <li>
          <Link href="/exam">Start SAA-C03 practice</Link>
        </li>
        <li>
          <Link href="/admin/jobs">AI jobs (local/dev)</Link>
        </li>
        <li>
          <Link href="/experimental/webllm">Experimental on-device explanations</Link>
        </li>
      </ul>
      <p style={{ opacity: 0.75, fontSize: 14 }}>
        API base: <code>{process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}</code>
      </p>
    </div>
  );
}
