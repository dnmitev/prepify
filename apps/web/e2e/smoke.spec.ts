import { expect, test } from "@playwright/test";

test("home renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Prepify/i })).toBeVisible();
  await expect(page.getByTestId("app-nav")).toBeVisible();
});

test("primary nav on history", async ({ page }) => {
  await page.goto("/history");
  await expect(page.getByTestId("app-nav")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
});
