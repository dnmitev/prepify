import Link from "next/link";

export default function HomePage() {
  return (
    <div className="card">
      <h1>Prepify</h1>
      <p>Practice exams with timed attempts, pause/resume, and estimated scaled scoring.</p>
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
