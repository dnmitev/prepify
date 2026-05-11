import Link from "next/link";
import { apiGet } from "@/lib/api";
import { formatAttemptClock } from "@/lib/resumable-attempts";

export const dynamic = "force-dynamic";

type HistoryResponse = {
  items: {
    id: string;
    examTypeCode: string;
    status: string;
    remainingActiveSeconds: number;
    scaledScore: number | null;
    passed: boolean | null;
    createdAt: string;
    submittedAt: string | null;
    lastActivityAt: string;
  }[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function formatShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

function passLabel(p: boolean | null): string {
  if (p === true) return "Pass";
  if (p === false) return "Fail";
  return "—";
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.pageSize ?? "20", 10) || 20));

  let data: HistoryResponse;
  try {
    data = await apiGet<HistoryResponse>(
      `/attempts/history?page=${String(page)}&pageSize=${String(pageSize)}`,
    );
  } catch {
    return (
      <div className="card card-wide">
        <h1>Attempt history</h1>
        <p style={{ color: "#fca5a5" }}>Could not load attempt history. Is the API running?</p>
        <p>
          <Link href="/">Home</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="card card-wide">
      <h1>Attempt history</h1>
      <p style={{ opacity: 0.85 }}>
        {String(data.total)} attempt{data.total === 1 ? "" : "s"} total · page {String(data.page)} of{" "}
        {String(data.totalPages)}
      </p>

      <div style={{ overflowX: "auto", marginTop: 16 }}>
        <table className="history-grid">
          <thead>
            <tr>
              <th>Exam</th>
              <th>Status</th>
              <th>Pass</th>
              <th>Score</th>
              <th>Time left</th>
              <th>Started</th>
              <th>Closed</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ opacity: 0.75 }}>
                  No attempts yet.
                </td>
              </tr>
            ) : (
              data.items.map((row) => {
                const finished = row.status === "submitted" || row.status === "expired";
                const inProgress = row.status === "active" || row.status === "paused";
                const scoreText =
                  row.scaledScore != null ? `${String(row.scaledScore)} / 1000` : "—";
                const timeLeft = inProgress ? formatAttemptClock(row.remainingActiveSeconds) : "—";
                const closed = row.submittedAt ? formatShort(row.submittedAt) : "—";

                return (
                  <tr key={row.id}>
                    <td>{row.examTypeCode}</td>
                    <td>{row.status}</td>
                    <td>{passLabel(row.passed)}</td>
                    <td>{scoreText}</td>
                    <td>{timeLeft}</td>
                    <td>{formatShort(row.createdAt)}</td>
                    <td>{closed}</td>
                    <td>
                      {finished ? (
                        <Link href={`/attempt/${row.id}/results`}>Results</Link>
                      ) : (
                        <Link href={`/attempt/${row.id}`} data-testid={`history-continue-${row.id}`}>
                          Continue
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <nav
        style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}
        aria-label="Pagination"
      >
        {data.page > 1 ? (
          <Link
            href={`/history?${new URLSearchParams({ page: String(data.page - 1), pageSize: String(data.pageSize) }).toString()}`}
          >
            Previous
          </Link>
        ) : (
          <span style={{ opacity: 0.45 }}>Previous</span>
        )}
        {data.page < data.totalPages ? (
          <Link
            href={`/history?${new URLSearchParams({ page: String(data.page + 1), pageSize: String(data.pageSize) }).toString()}`}
          >
            Next
          </Link>
        ) : (
          <span style={{ opacity: 0.45 }}>Next</span>
        )}
        <span style={{ opacity: 0.65, fontSize: 13 }}>{String(data.pageSize)} per page</span>
        <Link href="/" style={{ marginLeft: "auto" }}>
          Home
        </Link>
      </nav>
    </div>
  );
}
