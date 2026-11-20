import { expect, test } from "@playwright/test";
import { DESKTOP, MOBILE, signIn, testAccount } from "./sherlock-helpers";

// Journey 1: a learner signs in and lands on a usable Academy home screen.
// Account: the 16+ learner (GlitchTestTeen17, nga-test only), not GlitchTestFresh, so the
// sign-in rate limit (10 per 15 minutes per account) is left for the lesson journey.
// Read-only: no progress is changed.
const sizes = [
  { label: "phone 390x844", viewport: MOBILE },
  { label: "desktop 1280x900", viewport: DESKTOP },
];

for (const { label, viewport } of sizes) {
  test.describe(`sign-in and home screen, ${label}`, () => {
    test.use({ viewport });

    test("learner signs in and sees the Academy home", async ({ page }) => {
      const learner = testAccount("learner_16plus");
      await signIn(page, learner);

      await expect(page.getByRole("heading", { name: "Academy", exact: true })).toBeVisible();
      await expect(
        page.getByRole("button", { name: new RegExp(`Profiles for ${learner.username}`) }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: /^Module 1: Control Your Spending/ })).toBeVisible();
      await expect(page.getByRole("button", { name: "Academy step 1", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: /coins to cash in/i }).first()).toBeVisible();

      // Main navigation is reachable.
      for (const name of ["Academy", "Launchpad", "Vault", "Community", "Settings"]) {
        await expect(page.getByRole("link", { name }).first()).toBeVisible();
      }
    });

    test("a signed-out visitor cannot open the Academy and is offered Log in", async ({ page }) => {
      await page.goto("/dashboard/academy");
      await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
      await expect(page).not.toHaveURL(/\/dashboard\//);
      await expect(page.getByRole("button", { name: /coins to cash in/i })).toHaveCount(0);
    });
  });
}
