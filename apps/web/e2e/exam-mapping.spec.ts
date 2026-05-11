import { expect, test } from "@playwright/test";

/** Same default as `apps/web/lib/api.ts` — used only for the health check (Playwright does not load Next env into Node). */
const apiUrl =
  process.env["PLAYWRIGHT_API_URL"] ?? process.env["NEXT_PUBLIC_API_URL"] ?? "http://127.0.0.1:4000";

test.describe("exam practice bank mapping", () => {
  test("stems and options are not guide bullets or placeholder labels", async ({ page, request }) => {
    const health = await request.get(`${apiUrl}/health`).catch(() => null);
    test.skip(!health?.ok(), "API not reachable — run Postgres, migrate, seed, then `npm run dev -w @prepify/api` (+ web).");

    await page.goto("/exam");
    await page.getByRole("button", { name: /Begin attempt/i }).click();
    await page.waitForURL(/\/attempt\//);

    const stem = page.getByTestId("question-stem");
    await expect(stem).toBeVisible();

    // Attempt items are shuffled — do not assert a fixed practice Q# here.
    await expect(stem).not.toContainText(/Compensatory scoring/i);

    await expect(page.getByText("Correct answer", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Incorrect answer", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Another distractor", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Final distractor", { exact: true })).toHaveCount(0);

    // Real practice stems are scenario-length; guide bullets / titles are much shorter.
    const firstText = await stem.innerText();
    expect(firstText.trim().length).toBeGreaterThan(120);

    for (let i = 0; i < 5; i++) {
      await expect(page.getByTestId("question-stem")).not.toContainText(/Compensatory scoring/i);
      await expect(page.getByText("Correct answer", { exact: true })).toHaveCount(0);
      const t = await page.getByTestId("question-stem").innerText();
      expect(t.trim().length).toBeGreaterThan(120);
      if (i < 4) {
        await page.locator(".card").getByRole("button", { name: "Next" }).click();
      }
    }
  });
});
