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

function boxesOverlap(
  a: { left: number; right: number; top: number; bottom: number },
  b: { left: number; right: number; top: number; bottom: number },
): boolean {
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return width > 1 && height > 1;
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

test("vault advanced money does not overlap the privacy policy", async ({
  page,
}) => {
  await openAsExplorer(page, "/dashboard/vault");
  await dismissHubIntro(page);
  await expect(page.getByText("Advanced Money", { exact: true })).toBeVisible();

  for (const width of [320, 375, 414]) {
    await page.setViewportSize({ width, height: 667 });
    const main = page.locator("main");
    await main.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });

    const fit = await page.evaluate(() => {
      function box(element: Element | null) {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      }
      const heading = box(
        [...document.querySelectorAll("span,h1,h2,h3")].find(
          (element) => element.textContent?.trim() === "Advanced Money",
        ) ?? null,
      );
      const description = box(
        [...document.querySelectorAll("span,p")].find(
          (element) =>
            element.childElementCount === 0 &&
            element.textContent?.includes("Compound Growth, Ledger"),
        ) ?? null,
      );
      const privacy = box(
        [...document.querySelectorAll("a")].find(
          (element) => element.textContent?.trim() === "Privacy Policy",
        ) ?? null,
      );
      return { heading, description, privacy };
    });

    expect(fit.heading, `heading at ${width}`).not.toBeNull();
    expect(fit.description, `description at ${width}`).not.toBeNull();
    expect(fit.privacy, `privacy at ${width}`).not.toBeNull();
    if (!fit.heading || !fit.description || !fit.privacy) continue;

    expect(
      boxesOverlap(fit.heading, fit.privacy),
      `heading overlaps privacy at ${width}`,
    ).toBe(false);
    expect(
      boxesOverlap(fit.description, fit.privacy),
      `description overlaps privacy at ${width}`,
    ).toBe(false);
    expect(
      boxesOverlap(fit.heading, fit.description),
      `heading overlaps description at ${width}`,
    ).toBe(false);
  }

  await page.setViewportSize({ width: 375, height: 667 });
  await page.locator("main").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await page.screenshot({
    path: "/opt/cursor/artifacts/vault-advanced-money-privacy.png",
  });
});
