import { expect, type Page, test } from "@playwright/test";

const SESSION_KEY = "nga_guest_session";
const PAGE_INTRO_KEY = "nga_page_intro_seen_by_account_v1";
const PROGRESS_CACHE_KEY = "nga_account_progress_by_user_v1";

const LEARNER_ID = "22222222-2222-2222-2222-222222222222";

const LEARNER_SESSION = {
  accessMode: "registered",
  username: "pennytest",
  birthYear: 2012,
  birthYearLocked: true,
  ageTier: "pathfinder",
  curriculumCohort: "pathfinder",
  accountStatus: "ACTIVE",
  accountRole: "child",
  consentApprovedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  supabaseUserId: LEARNER_ID,
  learnerEmail: "pennytest@example.com",
};

const TEACHER_SESSION = {
  accessMode: "registered",
  username: "teachertest",
  birthYear: 1980,
  birthYearLocked: true,
  ageTier: "maverick",
  curriculumCohort: "pathfinder",
  accountStatus: "ACTIVE",
  accountRole: "teacher",
  isTeacher: true,
  consentApprovedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  supabaseUserId: "33333333-3333-3333-3333-333333333333",
  learnerEmail: "teachertest@example.com",
};

test.use({ viewport: { width: 390, height: 844 } });

async function installSession(
  page: Page,
  session: typeof LEARNER_SESSION | typeof TEACHER_SESSION,
) {
  await page.addInitScript(
    ([key, value]) => {
      const raw = JSON.stringify(value);
      window.localStorage.setItem(key, raw);
      window.sessionStorage.setItem(key, raw);
    },
    [SESSION_KEY, session] as const,
  );
}

test("intro is one-time across sign-out and medals reopen from help", async ({
  page,
}) => {
  await installSession(page, LEARNER_SESSION);
  await page.goto("/dashboard/academy");

  const letsGo = page.locator("button", { hasText: "Let's go" });
  await expect(letsGo).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#hub-intro-academy-title")).toHaveText("Academy");
  await expect(
    page.getByText("Your medals live in the cup. Tap it anytime."),
  ).toHaveCount(0);
  await page.screenshot({
    path: "/opt/cursor/artifacts/intro-academy-first.png",
    fullPage: false,
  });

  await letsGo.click({ force: true });
  await expect(letsGo).toHaveCount(0);
  const aboutAcademy = page.getByRole("button", { name: "About Academy" });
  await expect(aboutAcademy).toBeVisible();
  await page.screenshot({
    path: "/opt/cursor/artifacts/intro-academy-dismissed.png",
    fullPage: false,
  });

  await aboutAcademy.click();
  const gotIt = page.locator("button", { hasText: "Got it" });
  await expect(page.locator("#hub-intro-academy-title")).toBeVisible();
  await expect(gotIt).toBeVisible();
  await page.screenshot({
    path: "/opt/cursor/artifacts/intro-academy-reopened.png",
    fullPage: false,
  });
  await gotIt.click({ force: true });
  await expect(page.locator("#hub-intro-academy-title")).toHaveCount(0);

  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Log Out" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/dashboard"), {
    timeout: 15_000,
  });

  await page.evaluate(
    ([key, session]) => {
      const raw = JSON.stringify(session);
      window.localStorage.setItem(key, raw);
      window.sessionStorage.setItem(key, raw);
    },
    [SESSION_KEY, LEARNER_SESSION] as const,
  );
  await page.goto("/dashboard/academy");
  await expect(aboutAcademy).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(2500);
  await expect(page.locator("button", { hasText: "Let's go" })).toHaveCount(0);
  await page.screenshot({
    path: "/opt/cursor/artifacts/intro-after-signin.png",
    fullPage: false,
  });

  await page.evaluate(
    ([introKey, cacheKey, userId]) => {
      window.localStorage.removeItem(introKey);
      window.localStorage.setItem(
        cacheKey,
        JSON.stringify({
          [userId]: {
            schemaVersion: 1,
            academyProgress: null,
            wallet: null,
            skillProgress: null,
            vaultProfile: null,
            vaultSession: null,
            pageIntros: { hubs: { academy: true }, medals: true },
          },
        }),
      );
    },
    [PAGE_INTRO_KEY, PROGRESS_CACHE_KEY, LEARNER_ID] as const,
  );
  await page.goto("/dashboard/academy");
  await expect(page.getByRole("button", { name: "About Academy" })).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForTimeout(2500);
  await expect(page.locator("button", { hasText: "Let's go" })).toHaveCount(0);

  await page.getByRole("button", { name: "Open medals" }).click();
  await expect(page.locator("#medals-intro-title")).toHaveCount(0);
  await expect(page.locator('button[aria-label="About medals"]')).toBeVisible();
  await page.screenshot({
    path: "/opt/cursor/artifacts/medals-already-seen.png",
    fullPage: false,
  });
  await page.locator('button[aria-label="Close"]').click({ force: true });

  await page.evaluate((introKey) => {
    const raw = window.localStorage.getItem(introKey);
    if (!raw) return;
    const store = JSON.parse(raw) as Record<string, { medals?: boolean }>;
    for (const entry of Object.values(store)) {
      if (entry && typeof entry === "object") entry.medals = false;
    }
    window.localStorage.setItem(introKey, JSON.stringify(store));
  }, PAGE_INTRO_KEY);
  await page.getByRole("button", { name: "Open medals" }).click();
  await expect(page.locator("#medals-intro-title")).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByText("Your medals live in the cup. Tap it anytime."),
  ).toBeVisible();
  await page.screenshot({
    path: "/opt/cursor/artifacts/medals-intro-first.png",
    fullPage: false,
  });
  await page.locator("#medals-intro-body ~ button").click({ force: true });
  await expect(page.locator("#medals-intro-title")).toHaveCount(0);
  const aboutMedals = page.locator('button[aria-label="About medals"]');
  await expect(aboutMedals).toBeVisible();
  await aboutMedals.click({ force: true });
  await expect(page.locator("#medals-intro-title")).toBeVisible();
  await page.screenshot({
    path: "/opt/cursor/artifacts/medals-intro-reopened.png",
    fullPage: false,
  });
  await page.locator("button", { hasText: "Got it" }).click({ force: true });
  await page.locator('button[aria-label="Close"]').click({ force: true });
  await page.getByRole("button", { name: "Open medals" }).click();
  await page.waitForTimeout(500);
  await expect(page.locator("#medals-intro-title")).toHaveCount(0);
  await expect(aboutMedals).toBeVisible();
});

test("settings class link gives immediate feedback", async ({ page }) => {
  await installSession(page, TEACHER_SESSION);
  await page.goto("/dashboard/settings");
  const classLink = page.getByRole("link", { name: "Class" });
  await expect(classLink).toBeVisible({ timeout: 15_000 });
  await expect(classLink).toHaveAttribute("href", "/dashboard/class");

  let releaseNavigation = () => {};
  const holdNavigation = new Promise<void>((resolve) => {
    releaseNavigation = resolve;
  });
  await page.route("**/dashboard/class**", async (route) => {
    await holdNavigation;
    await route.continue();
  });

  await classLink.click();
  await expect(page.getByText(/Opening…|Opening class/)).toBeVisible({
    timeout: 5_000,
  });
  releaseNavigation();
});

test("teacher class lists stay collapsed until opened and still print", async ({
  page,
}) => {
  await installSession(page, TEACHER_SESSION);
  await page.goto("/dashboard/class/preview");

  await expect(
    page.getByRole("heading", { name: "Pathfinder class", exact: true }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("8 of 30 seats allocated")).toBeVisible();
  await expect(
    page.getByText("Yellow", { exact: true }).filter({ visible: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("0 XP", { exact: true }).filter({ visible: true }),
  ).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Show students (8)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Print usernames" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove all students in class" })).toBeVisible();
  await expect(page.getByText("To change the track, remove all students first.")).toBeVisible();
  await expect(
    page.getByText("amber2", { exact: true }).filter({ visible: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-v2-390-collapsed.png",
    fullPage: false,
  });

  await page.getByRole("switch", { name: "Show class password" }).click();
  await expect(
    page.getByText("Yellow", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-v2-390-password-shown.png",
    fullPage: false,
  });
  await page.getByRole("switch", { name: "Hide" }).click();
  await expect(
    page.getByText("Yellow", { exact: true }).filter({ visible: true }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Show students (8)" }).click();
  const hideStudents = page.getByRole("button", { name: "Hide students" });
  await expect(hideStudents).toBeVisible();
  await expect(page.getByText("amber2", { exact: true }).first()).toBeVisible();
  const xpChevron = await hideStudents.locator("svg").boundingBox();
  expect(xpChevron?.width ?? 0).toBeGreaterThan(12);
  expect(xpChevron?.height ?? 0).toBeGreaterThan(12);
  await expect(page.getByRole("button", { name: "Remove amber2" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Allocate seats" })).toBeVisible();
  await page.getByText("amber2", { exact: true }).first().scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-v2-390-students.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Allocate seats" }).click();
  const seatInput = page.getByLabel("Seats to allocate");
  await expect(seatInput).toBeVisible();
  await expect(seatInput).toHaveAttribute("max", "22");
  await expect(page.getByRole("button", { name: "Allocate", exact: true })).toBeDisabled();
  await seatInput.fill("12");
  await expect(page.getByRole("button", { name: "Allocate", exact: true })).toBeEnabled();
  await seatInput.scrollIntoViewIfNeeded();
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(
    overflow.clientWidth + 1,
  );
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-v2-390-allocate.png",
    fullPage: false,
  });

  const printUsernames = page.getByRole("button", { name: "Print usernames" });
  const navBox = await page.locator("[data-dashboard-nav]").boundingBox();
  const printBox = await printUsernames.boundingBox();
  expect(navBox).toBeTruthy();
  expect(printBox).toBeTruthy();
  expect(navBox!.y + navBox!.height).toBeGreaterThan(820);
  expect(printBox!.y + printBox!.height).toBeLessThanOrEqual(navBox!.y + 1);

  await page.emulateMedia({ media: "print" });
  await expect(page.getByText("Class password: Yellow")).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "amber2" }).filter({ visible: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("cell", { name: "forest6" }).filter({ visible: true }),
  ).toHaveCount(1);
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-v2-390-print.png",
    fullPage: true,
  });

  await page.emulateMedia({ media: "screen" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/dashboard/class/preview");
  await expect(page.getByText("8 of 30 seats allocated")).toBeVisible({
    timeout: 15_000,
  });
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-v2-desktop.png",
    fullPage: false,
  });
  await page.getByRole("button", { name: "Show students (8)" }).click();
  await expect(page.getByText("amber2", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Allocate seats" }).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-v2-desktop-students.png",
    fullPage: false,
  });
  await page.getByRole("button", { name: "Change", exact: true }).click();
  const classPassword = page.getByRole("textbox", { name: "Class password" });
  await expect(classPassword).toHaveAttribute("type", "password");
  await expect(classPassword).toHaveValue("Yellow");
});
