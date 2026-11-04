/**
 * Launchpad venture test route: progress survives a reload (localStorage
 * only) and ?reset=1 clears it.
 */
import { expect, test } from "@playwright/test";
import { MOBILE, ROUTE, shot, step, track, url } from "./launchpad-venture-helpers";

test.use({ viewport: MOBILE, hasTouch: true, isMobile: true });

test("reload keeps progress, ?reset=1 clears it", async ({ page }, info) => {
  test.setTimeout(240_000);
  const t = track(page, info, "p");
  const main = page.locator("main");

  await step(t, "Fresh start, finish the offer door, half-fill the goals", async () => {
    await page.goto(url("reset=1"));
    await page.getByRole("button", { name: "Dog walking. Open" }).click({ timeout: 60_000 });
    await main.getByRole("button", { name: "Start building" }).click();
    await main.getByRole("button", { name: "Go to Level 1" }).click();
    await page.getByRole("button", { name: /Define the business, up next/ }).click();
    await main.getByRole("button", { name: /Pick what your business will offer/ }).click();
    await main.getByRole("button", { name: "Grooming", exact: true }).click();
    await main.getByRole("button", { name: "Finish ›" }).click();
    await main.getByRole("button", { name: /Find the why/ }).click();
    await main.getByRole("button", { name: "Move Learn new skills up" }).click();
    await main.getByRole("button", { name: "Finish ›" }).click();
    await main.getByRole("button", { name: /Know your impact/ }).click();
    await main.getByRole("button", { name: "Older people", exact: true }).click();
    await main.getByRole("button", { name: "Finish ›" }).click();
    await main.getByRole("button", { name: /Set your goals/ }).click();
    // Step 1 is goal 1 (no separate intro page).
    await expect(main).toContainText("Make money");
    await main.getByLabel("Amount").fill("250");
  });
  await shot(t, "Mid-flow, goal 1 half filled", null);

  await step(t, "Reload: back on home with the In Progress tile (view is not in the URL)", async () => {
    // The URL still has ?reset=1 from the fresh start, so load the plain route to simulate a reload.
    await page.goto(ROUTE);
    await page.reload();
    await expect(page.locator('[data-in-progress="dog-walking"]')).toBeVisible({ timeout: 60_000 });
  });
  await shot(t, "After reload, home", page.locator('[data-in-progress="dog-walking"]').getByRole("button", { name: "Continue" }));

  await step(t, "Continue: doors keep their Done marks and saved answers", async () => {
    await page.locator('[data-in-progress="dog-walking"]').getByRole("button", { name: "Continue" }).click();
    await main.getByRole("button", { name: "Go to Level 1" }).click();
    await page.getByRole("button", { name: /Define the business/ }).click();
    for (const d of ["Pick what your business will offer", "Find the why", "Know your impact"])
      await expect(main.getByRole("button", { name: new RegExp(d) })).toContainText("Done");
    await expect(main.getByRole("button", { name: /Set your goals/ })).toContainText("Up next");
    await main.getByRole("button", { name: /Pick what your business will offer/ }).click();
    await expect(main.getByRole("button", { name: "Grooming", exact: true })).toHaveAttribute("aria-pressed", "true");
    await main.getByRole("button", { name: "Finish ›" }).click();
    await main.getByRole("button", { name: /Set your goals/ }).click();
    // Step 1 is goal 1 (no separate intro page).
    await expect(main).toContainText("Goal 1 of 6", { ignoreCase: true });
    await expect(main).toContainText("Make money");
    await expect(main.getByLabel("Amount")).toHaveValue(/250/);
  });
  await shot(t, "After reload, goal 1 still has 250", null);

  await step(t, "Plain reload (no reset) keeps the In Progress tile", async () => {
    await page.goto(ROUTE);
    await expect(page.locator('[data-in-progress="dog-walking"]')).toBeVisible({ timeout: 60_000 });
  });

  await step(t, "?reset=1 clears progress: no In Progress tile, storage empty", async () => {
    await page.goto(url("reset=1"));
    await expect(page.getByRole("button", { name: "Dog walking. Open" })).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-in-progress="dog-walking"]')).toHaveCount(0);
    const stored = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("lp-venture-test")));
    const progress = await page.evaluate(() => localStorage.getItem("lp-venture-test:v1:dog-walking"));
    expect(progress === null || !progress.includes("Grooming".toLowerCase()), `left over: ${stored.join(",")}`).toBeTruthy();
  });
  await shot(t, "After ?reset=1, home is empty", page.getByRole("button", { name: "Dog walking. Open" }));

  await step(t, "After reset, opening the venture shows onboarding again", async () => {
    await page.getByRole("button", { name: "Dog walking. Open" }).click();
    await expect(page.getByRole("heading", { name: "Build your business one floor at a time." })).toBeVisible();
  });
  await shot(t, "Onboarding again after reset", main.getByRole("button", { name: "Start building" }));
});
