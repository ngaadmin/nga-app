import { expect, type Page, test } from "@playwright/test";

const SESSION_KEY = "nga_guest_session";
const PAGE_INTRO_KEY = "nga_page_intro_seen_by_account_v1";
const PROGRESS_CACHE_KEY = "nga_account_progress_by_user_v1";

const LEARNER_ID = "22222222-2222-2222-2222-222222222222";

const LEARNER_SESSION = {
  accessMode: "registered",
  username: "pennytest",
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
  ageTier: "pathfinder",
  curriculumCohort: "pathfinder",
  accountStatus: "ACTIVE",
  accountRole: "teacher",
  isTeacher: true,
  consentApprovedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  supabaseUserId: "33333333-3333-3333-3333-333333333333",
  learnerEmail: "teachertest@example.com",
};

const EMAIL_TEACHER_SESSION = {
  ...TEACHER_SESSION,
  username: "uaaaaaaaaaaaaaaaaaaa",
  learnerEmail: "cath+recteacher1@example.com",
  email: "cath+recteacher1@example.com",
};

test.use({ viewport: { width: 390, height: 844 } });

async function installSession(
  page: Page,
  session:
    | typeof LEARNER_SESSION
    | typeof TEACHER_SESSION
    | typeof EMAIL_TEACHER_SESSION,
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

test("community intro stays dismissed and has no info button", async ({ page }) => {
  await installSession(page, LEARNER_SESSION);
  await page.goto("/dashboard/community", { waitUntil: "domcontentloaded" });

  const letsGo = page.locator("button", { hasText: "Let's go" });
  await expect(letsGo).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#hub-intro-community-title")).toHaveText("Community");
  await letsGo.click({ force: true });
  await expect(page.locator("#hub-intro-community-title")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "About Community" })).toHaveCount(0);

  async function openTab(href: string) {
    await page.locator(`[data-dashboard-nav] a[href="${href}"]`).evaluate((link) => {
      (link as HTMLAnchorElement).click();
    });
    await expect(page).toHaveURL(new RegExp(href), { timeout: 20_000 });
  }
  await openTab("/dashboard/academy");
  await openTab("/dashboard/community");
  await page.waitForTimeout(400);
  await expect(page.locator("button", { hasText: "Let's go" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "About Community" })).toHaveCount(0);

  await page.reload({ waitUntil: "domcontentloaded", timeout: 20_000 });
  // The hub title and the locked leaderboard are both h1s named Community.
  await expect(
    page
      .getByRole("main")
      .getByRole("heading", { level: 1, name: "Community", exact: true })
      .first(),
  ).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForTimeout(400);
  await expect(page.locator("#hub-intro-community-title")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "About Community" })).toHaveCount(0);
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
  await expect(page.getByText("8 of 30 users allocated")).toBeVisible();
  await expect(
    page.getByText("Yellow", { exact: true }).filter({ visible: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("0 XP", { exact: true }).filter({ visible: true }),
  ).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Show users (8)" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Print usernames" })).toHaveAttribute(
    "href",
    "/class/preview-teacher/print",
  );
  await expect(page.getByRole("button", { name: "Remove all users in class" })).toBeVisible();
  await expect(page.getByText("To change the track, remove all users first.")).toBeVisible();
  await expect(
    page.getByText("amber2", { exact: true }).filter({ visible: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Change", exact: true })).toHaveCount(1);
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-final-390-locked.png",
    fullPage: false,
  });

  await page.getByRole("switch", { name: "Show class password" }).click();
  await expect(
    page.getByText("Yellow", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-final-390-password-shown.png",
    fullPage: false,
  });
  await page.getByRole("switch", { name: "Show class password" }).click();
  await expect(
    page.getByText("Yellow", { exact: true }).filter({ visible: true }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Change", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Change class password" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Users will need the new password next time they log in.")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Save" })).toBeDisabled();
  await dialog.getByRole("button", { name: "Suggest one" }).click();
  const fields = dialog.getByRole("textbox");
  const suggested = await fields.first().inputValue();
  expect(suggested).toMatch(/^[a-z]{3,8}-[a-z]{3,8}$/);
  await fields.nth(1).fill("not-the-same");
  await expect(dialog.getByText("These don't match yet.")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Save" })).toBeDisabled();
  await fields.first().fill("Blue-Tiger");
  await expect(dialog.getByText("Use two easy words with a dash, like blue-tiger.")).toBeVisible();
  await fields.first().fill("blue-tiger");
  await fields.nth(1).fill("blue-tiger");
  await expect(dialog.getByRole("button", { name: "Save" })).toBeEnabled();
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-final-390-modal.png",
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);

  await page.getByRole("button", { name: "Show users (8)" }).click();
  const hideUsers = page.getByRole("button", { name: "Hide users" });
  await expect(hideUsers).toBeVisible();
  await expect(page.getByText("amber2", { exact: true }).first()).toBeVisible();
  const xpChevron = await hideUsers.locator("svg").boundingBox();
  expect(xpChevron?.width ?? 0).toBeGreaterThan(12);
  expect(xpChevron?.height ?? 0).toBeGreaterThan(12);
  await expect(page.getByRole("link", { name: "View amber2" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Allocate users" })).toBeVisible();
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-final-390-users.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Allocate users" }).click();
  const seatInput = page.getByLabel("Users to allocate");
  await expect(seatInput).toBeVisible();
  await expect(seatInput).toHaveAttribute("max", "22");
  await expect(page.getByRole("button", { name: "Allocate", exact: true })).toBeDisabled();
  await seatInput.fill("12");
  await expect(page.getByRole("button", { name: "Allocate", exact: true })).toBeEnabled();
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(
    overflow.clientWidth + 1,
  );
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-final-390-allocate.png",
    fullPage: false,
  });

  const printUsernames = page.getByRole("link", { name: "Print usernames" });
  const navBox = await page.locator("[data-dashboard-nav]").boundingBox();
  const printBox = await printUsernames.boundingBox();
  expect(navBox).toBeTruthy();
  expect(printBox).toBeTruthy();
  expect(navBox!.y + navBox!.height).toBeGreaterThan(820);
  expect(printBox!.y + printBox!.height).toBeLessThanOrEqual(navBox!.y + 1);
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-final-390-print-tap.png",
    fullPage: false,
  });

  await page.evaluate(() => {
    window.print = () => {
      const win = window as Window & { __printed?: number };
      win.__printed = (win.__printed ?? 0) + 1;
    };
  });
  await printUsernames.click();
  await expect(page).toHaveURL(/\/class\/preview-teacher\/print$/);
  await expect(page.getByRole("heading", { name: "Usernames" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Print", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download PDF" })).toBeVisible();
  await expect(page.getByText(/password/i)).toHaveCount(0);
  await expect(page.getByText("Yellow", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "User", exact: true })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Username", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as Window & { __printed?: number }).__printed ?? 0)).toBe(1);
  await page.getByRole("button", { name: "Print", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as Window & { __printed?: number }).__printed ?? 0)).toBe(2);
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-final-390-print-screen.png",
    fullPage: false,
  });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("pathfinder-class-usernames.pdf");

  await page.emulateMedia({ media: "print" });
  await page.setViewportSize({ width: 794, height: 1123 });
  await expect(page.getByRole("heading", { name: "Usernames" })).toBeHidden();
  await expect(page.getByText(/password/i)).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "User", exact: true })).toBeVisible();
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-final-print-a4.png",
    fullPage: true,
  });

  await page.emulateMedia({ media: "screen" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/dashboard/class/preview");
  await expect(page.getByText("8 of 30 users allocated")).toBeVisible({
    timeout: 15_000,
  });
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-final-desktop.png",
    fullPage: false,
  });
  await page.getByRole("button", { name: "Show users (8)" }).click();
  await expect(page.getByText("amber2", { exact: true }).first()).toBeVisible();
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-final-desktop-users.png",
    fullPage: false,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard/class/preview?empty=1");
  await expect(page.getByText("0 of 30 users allocated")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("button", { name: "Show users (0)" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Print usernames" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Change", exact: true })).toHaveCount(2);
  await expect(page.getByText("To change the track, remove all users first.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Allocate users" })).toBeVisible();
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-final-390-editable.png",
    fullPage: false,
  });

  await page.goto("/dashboard/class/preview?saved=1");
  await expect(page.getByRole("status").filter({ hasText: "Class password changed" })).toBeVisible({
    timeout: 15_000,
  });
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-final-390-password-saved.png",
    fullPage: false,
  });
});

test("print usernames stays clear of the user count", async ({ page }) => {
  await installSession(page, TEACHER_SESSION);
  await page.goto("/dashboard/class/preview");
  const showUsers = page.getByRole("button", { name: "Show users (8)" });
  await expect(showUsers).toBeVisible({ timeout: 15_000 });

  for (const width of [320, 375, 414, 1280]) {
    await page.setViewportSize({ width, height: width >= 1024 ? 900 : 844 });
    const printUsernames = page.getByRole("link", { name: "Print usernames" });
    const showBox = await showUsers.boundingBox();
    const printBox = await printUsernames.boundingBox();
    expect(showBox, `show users at ${width}`).toBeTruthy();
    expect(printBox, `print usernames at ${width}`).toBeTruthy();
    const separated =
      printBox!.x + printBox!.width <= showBox!.x + 1 ||
      showBox!.x + showBox!.width <= printBox!.x + 1 ||
      printBox!.y + printBox!.height <= showBox!.y + 1 ||
      showBox!.y + showBox!.height <= printBox!.y + 1;
    expect(separated, `overlap at ${width}`).toBe(true);
    if (width < 390) {
      expect(printBox!.y).toBeGreaterThan(showBox!.y + showBox!.height - 1);
    }
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth, `overflow at ${width}`).toBeLessThanOrEqual(
      overflow.clientWidth + 1,
    );
    await page.screenshot({
      path: `/opt/cursor/artifacts/class-users-row-${width}.png`,
      fullPage: false,
    });
  }
});

const FOUR_USERS = [
  { username: "amber2", xp: "120 XP" },
  { username: "amber3", xp: "80 XP" },
  { username: "cedar2", xp: "45 XP" },
  { username: "forest6", xp: "10 XP" },
] as const;

async function scrollRowIntoSafeArea(page: Page, username: string) {
  await page.locator(`[data-class-user="${username}"]`).evaluate((el) => {
    const main = el.closest("main");
    if (!(main instanceof HTMLElement)) return;
    const nav = document.querySelector("[data-dashboard-nav]");
    const navTop = nav?.getBoundingClientRect().top ?? window.innerHeight;
    const mainRect = main.getBoundingClientRect();
    const safeBottom = Math.min(navTop, mainRect.bottom) - 12;
    const safeTop = mainRect.top + 8;
    const place = () => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom > safeBottom) main.scrollTop += rect.bottom - safeBottom;
      else if (rect.top < safeTop) main.scrollTop -= safeTop - rect.top;
    };
    place();
    place();
  });
}

test("header hides the teacher email and expanded users scroll to XP", async ({
  page,
}) => {
  await installSession(page, EMAIL_TEACHER_SESSION);
  await page.goto("/dashboard/class/preview?users=4");
  await expect(page.getByText("4 of 30 users allocated")).toBeVisible({
    timeout: 15_000,
  });

  const header = page.locator("[data-dashboard-status-header]");
  await expect(header.getByText("Teacher", { exact: true })).toBeVisible();
  await expect(header).not.toContainText("@");
  await expect(header).not.toContainText("cath+recteacher1");

  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({
    path: "/opt/cursor/artifacts/class-header-name-375.png",
    fullPage: false,
  });

  await page.getByRole("button", { name: "Show users (4)" }).click();
  await expect(page.locator("[data-class-user='amber2']")).toBeVisible();

  const viewports = [
    { width: 320, height: 568 },
    { width: 375, height: 667 },
    { width: 414, height: 736 },
    { width: 1280, height: 900 },
  ];

  for (const { width, height } of viewports) {
    await page.setViewportSize({ width, height });
    const main = page.locator("main");
    const nav = page.locator("[data-dashboard-nav]");
    const room = await main.evaluate((el) => {
      el.scrollTop = 0;
      const overflows = el.scrollHeight > el.clientHeight + 1;
      if (overflows) el.scrollTop = el.scrollHeight;
      return {
        overflows,
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      };
    });
    if (width < 768) {
      expect(room.overflows, `page scrolls at ${width}`).toBe(true);
      expect(room.scrollTop, `scroll moves at ${width}`).toBeGreaterThan(0);
    }

    for (const user of FOUR_USERS) {
      const row = page.locator(`[data-class-user="${user.username}"]`);
      await scrollRowIntoSafeArea(page, user.username);
      await expect(row.getByText(user.xp, { exact: true })).toBeVisible();
      const box = await row.boundingBox();
      expect(box, `${user.username} at ${width}`).toBeTruthy();
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(height + 1);
      if (width < 768) {
        const navBox = await nav.boundingBox();
        expect(navBox, "bottom nav").toBeTruthy();
        expect(box!.y + box!.height).toBeLessThanOrEqual(navBox!.y + 1);
      }
    }

    const last = page.locator("[data-class-user='forest6']");
    await scrollRowIntoSafeArea(page, "forest6");
    await expect(last.getByText("10 XP", { exact: true })).toBeVisible();
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
    await page.screenshot({
      path: `/opt/cursor/artifacts/class-users-scroll-${width}.png`,
      fullPage: false,
    });
  }
});
