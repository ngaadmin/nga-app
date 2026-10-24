import { expect, test } from "@playwright/test";

test.describe("cohort confirmation and log in", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("shows Got it as soon as a cohort is picked", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Try the free app" }).click();
    await page.getByRole("heading", { name: "Pick the path that matches your age." }).waitFor();
    const started = Date.now();
    await page.getByRole("button", { name: /Explorer/ }).click({ noWaitAfter: true });
    const gotIt = page.getByRole("heading", { name: "Got it!" });
    await expect(gotIt).toBeVisible();
    const feedbackMs = Date.now() - started;
    console.log(`cohort feedback ${feedbackMs}ms`);
    await expect(page.getByText("You picked Explorer.")).toBeVisible();
    await expect(page.getByText("Getting your lessons ready, just a moment…")).toBeVisible();
    await expect(page.locator("button", { hasText: "Pathfinder" })).toBeDisabled();
    await page.screenshot({ path: "/opt/cursor/artifacts/cohort-got-it-390.png" });
    await expect(page).toHaveURL(/\/dashboard\/academy/, { timeout: 20_000 });
    console.log(`cohort usable ${Date.now() - started}ms`);
    expect(feedbackMs).toBeLessThan(1000);
  });

  test("empty log in does not stick on the busy label", async ({ page }) => {
    await page.goto("/onboarding/sign-in");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Logging you in…")).toHaveCount(0);
    await expect(page.getByText("Enter your email or username and password.", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Log in" })).toBeEnabled();
  });

  test("log in shows Logging you in while the request runs", async ({ page }) => {
    await page.goto("/onboarding/sign-in");
    await page.getByPlaceholder("Email or username").fill("nobody-timing@example.com");
    await page.getByPlaceholder("Password").fill("not-a-real-password");
    await page.getByRole("button", { name: "Log in" }).click({ noWaitAfter: true });
    await expect(page.getByText("Logging you in…")).toBeVisible();
    await expect(page.locator("button", { hasText: "Logging you in" })).toBeDisabled();
    await page.screenshot({ path: "/opt/cursor/artifacts/login-busy-390.png" });
    await expect(page.getByText("Logging you in…")).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Log in" })).toBeEnabled();
  });
});
