import { expect, test } from "@playwright/test";

const apiUrl =
  process.env["PLAYWRIGHT_API_URL"] ?? process.env["NEXT_PUBLIC_API_URL"] ?? "http://127.0.0.1:4000";

test("home shows in-progress attempt and resume link opens the same attempt", async ({ page, request }) => {
  const health = await request.get(`${apiUrl}/health`).catch(() => null);
  test.skip(
    !health?.ok(),
    "API not reachable — run Postgres, migrate, seed, then `npm run dev -w @prepify/api` (+ web).",
  );

  await page.goto("/exam");
  await page.getByRole("button", { name: /Begin attempt/i }).click();
  await page.waitForURL(/\/attempt\/[0-9a-f-]+/i);
  const attemptId = page.url().match(/\/attempt\/([0-9a-f-]+)/i)?.[1];
  expect(attemptId).toBeTruthy();
  if (!attemptId) throw new Error("expected attempt id in URL");

  await page.goto("/");
  const resume = page.getByTestId(`resume-attempt-${attemptId}`);
  await expect(resume).toBeVisible();

  await resume.click();
  await expect(page).toHaveURL(new RegExp(`/attempt/${attemptId}`));
});
