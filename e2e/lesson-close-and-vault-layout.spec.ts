import { expect, type Page, test } from "@playwright/test";

const GUEST_SESSION_KEY = "nga_guest_session";

const EXPLORER_GUEST_SESSION = {
  accessMode: "guest",
  username: "lars",
  ageTier: "explorer",
  curriculumCohort: "explorer",
  accountStatus: "GUEST",
  createdAt: "2026-01-01T00:00:00.000Z",
};

test.use({
  viewport: { width: 375, height: 667 },
  hasTouch: true,
  isMobile: true,
});

async function openAsExplorer(page: Page, path: string): Promise<void> {
  await page.addInitScript(
    ([key, session]) => {
      const raw = JSON.stringify(session);
      window.localStorage.setItem(key, raw);
      window.sessionStorage.setItem(key, raw);
    },
    [GUEST_SESSION_KEY, EXPLORER_GUEST_SESSION] as const,
  );
  await page.goto(path);
}

async function dismissHubIntro(page: Page): Promise<void> {
  const intro = page.getByRole("button", { name: /Let's go|Got it/i });
  try {
    await intro.first().click({ timeout: 2_000 });
  } catch {
    // The first-visit card is skipped once this profile has already seen it.
  }
}

test("close lesson returns to Academy", async ({ page }) => {
  await openAsExplorer(page, "/dashboard/academy/lesson/1?preview=1");
  const close = page.getByRole("link", { name: "Close lesson" });
  await expect(close).toBeVisible();

  const placement = await close.evaluate((element) => {
    const header = element.closest("header");
    const linkBox = element.getBoundingClientRect();
    const headerBox = header?.getBoundingClientRect();
    return {
      linkLeft: linkBox.left,
      headerLeft: headerBox?.left ?? 0,
      headerTop: headerBox?.top ?? 0,
      linkTop: linkBox.top,
    };
  });
  expect(placement.linkLeft).toBeLessThanOrEqual(placement.headerLeft + 40);
  expect(placement.linkTop).toBeLessThanOrEqual(placement.headerTop + 24);
  await page.screenshot({
    path: "/opt/cursor/artifacts/lesson-close-button.png",
  });

  await close.click();
  await expect(page).toHaveURL(/\/dashboard\/academy\/?$/);
  await page.screenshot({
    path: "/opt/cursor/artifacts/lesson-close-returns-academy.png",
  });
});

test("vault intro leaves the bottom nav tappable and can close", async ({
  page,
}) => {
  await openAsExplorer(page, "/dashboard/vault");
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Let's go" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeVisible();

  const navClear = await page.evaluate(() => {
    const backdrop = document.querySelector("[data-hub-intro-backdrop]");
    const nav = document.querySelector("[data-dashboard-nav]");
    const academy = nav?.querySelector("a");
    if (!backdrop || !nav || !academy) return { ok: false, reason: "missing" };
    const backdropBox = backdrop.getBoundingClientRect();
    const navBox = nav.getBoundingClientRect();
    const linkBox = academy.getBoundingClientRect();
    const stack = document.elementsFromPoint(
      linkBox.left + linkBox.width / 2,
      linkBox.top + linkBox.height / 2,
    );
    const hit = stack.find(
      (element) => element.tagName !== "NEXTJS-PORTAL",
    );
    return {
      ok:
        backdropBox.bottom <= navBox.top + 1 &&
        hit instanceof Node &&
        (academy === hit || academy.contains(hit)),
      backdropBottom: backdropBox.bottom,
      navTop: navBox.top,
      hit: hit?.tagName ?? null,
    };
  });
  expect(navClear.ok, JSON.stringify(navClear)).toBe(true);

  await page.screenshot({
    path: "/opt/cursor/artifacts/vault-intro-nav.png",
  });

  await page.addStyleTag({
    content: "nextjs-portal { pointer-events: none !important; }",
  });
  await page
    .locator("[data-dashboard-nav]")
    .getByRole("link", { name: "Academy" })
    .tap();
  await expect(page).toHaveURL(/\/dashboard\/academy\/?$/);

  await page.goto("/dashboard/vault");
  await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).tap();
  await expect(dialog).toHaveCount(0);
  await page.screenshot({
    path: "/opt/cursor/artifacts/vault-intro-dismissed.png",
  });
});

test("vault has no legal footer after sign-in", async ({ page }) => {
  await openAsExplorer(page, "/dashboard/vault");
  await dismissHubIntro(page);
  await expect(page.getByText("Advanced Money", { exact: true })).toBeVisible();

  for (const width of [320, 375, 414]) {
    await page.setViewportSize({ width, height: 667 });
    await page.locator("main").evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(page.getByRole("navigation", { name: "Legal" })).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Privacy Policy", exact: true }),
    ).toHaveCount(0);
  }
});
