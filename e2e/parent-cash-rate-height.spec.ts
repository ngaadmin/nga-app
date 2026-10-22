import { expect, test } from "@playwright/test";

const SESSION_KEY = "nga_guest_session";

const PARENT_SESSION = {
  accessMode: "registered",
  username: "parenttest",
  ageTier: "maverick",
  curriculumCohort: "maverick",
  accountStatus: "ACTIVE",
  accountRole: "parent_master",
  consentApprovedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  supabaseUserId: "44444444-4444-4444-4444-444444444444",
  learnerEmail: "parenttest@example.com",
};

const CHILD_SESSION = {
  accessMode: "registered",
  username: "childtest",
  ageTier: "pathfinder",
  curriculumCohort: "pathfinder",
  accountStatus: "ACTIVE",
  accountRole: "child",
  consentApprovedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  supabaseUserId: "55555555-5555-5555-5555-555555555555",
  learnerEmail: "childtest@example.com",
};

function seedSession() {
  return (pair: readonly [string, typeof PARENT_SESSION]) => {
    const raw = JSON.stringify(pair[1]);
    window.localStorage.setItem(pair[0], raw);
    window.sessionStorage.setItem(pair[0], raw);
  };
}

test("coins cash rate stays visible on short viewports", async ({ page }) => {
  await page.addInitScript(seedSession(), [
    SESSION_KEY,
    PARENT_SESSION,
  ] as const);

  for (const size of [
    { width: 390, height: 844 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/dashboard/settings");
    const section = page.getByRole("region", { name: "Coins cash rate" });
    await expect(section).toBeVisible({ timeout: 15_000 });
    const box = await section.boundingBox();
    expect(box, `${size.width}x${size.height}`).toBeTruthy();
    expect(box!.height).toBeGreaterThan(40);
    await section.scrollIntoViewIfNeeded();
    const after = await section.boundingBox();
    expect(after!.height).toBeGreaterThan(40);
    expect(after!.y).toBeGreaterThanOrEqual(0);
    expect(after!.y).toBeLessThan(size.height);
  }

  await expect(page.getByRole("button", { name: "Change Parent PIN" })).toBeVisible();
});

test("a child settings page does not offer Change Parent PIN", async ({ page }) => {
  await page.addInitScript(seedSession(), [
    SESSION_KEY,
    CHILD_SESSION,
  ] as const);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard/settings");
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("button", { name: "Change Parent PIN" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Coins cash rate" })).toHaveCount(0);
});

test("launchpad journey caption does not say it is a mockup", async ({ page }) => {
  await page.addInitScript(seedSession(), [
    SESSION_KEY,
    CHILD_SESSION,
  ] as const);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard/launchpad");
  await expect(
    page.getByText("When you start a venture, its progress path will show here."),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Mockup for testing.")).toHaveCount(0);
});
