export function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

/** Maps browser fetch failures to an actionable message for local dev. */
export function formatApiError(error: unknown): string {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return `Could not reach the API at ${apiBase()}. Start it in another terminal: npm run dev -w @prepify/api — and ensure Postgres is running with migrations + seed (see README).`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return (await res.json()) as T;
}

export async function apiSend<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return (await res.json()) as T;
}
