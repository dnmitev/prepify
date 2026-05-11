/**
 * Whether an OpenAI-compatible HTTP client may omit `OPENAI_API_KEY` for local development
 * (loopback hosts or explicit opt-in via env — see README).
 */
export function allowsMissingOpenAiApiKey(
  openAiBaseUrl: string | undefined,
  env: NodeJS.ProcessEnv,
): boolean {
  if (env["LOCAL_LLM_SKIP_API_KEY"] === "1") {
    return true;
  }
  if (!openAiBaseUrl?.trim()) {
    return false;
  }
  try {
    const u = new URL(openAiBaseUrl);
    const h = u.hostname.toLowerCase();
    return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]";
  } catch {
    return false;
  }
}
