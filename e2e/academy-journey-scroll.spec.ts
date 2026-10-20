import { expect, type Page, test } from "@playwright/test";

const SESSION_KEY = "nga_guest_session";
const INTRO_KEY = "nga_page_intro_seen_by_account_v1";
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

const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 414, height: 736 },
  { width: 1280, height: 900 },
] as const;

test.use({ viewport: { width: 1280, height: 900 } });

async function openAcademy(page: Page) {
  await page.addInitScript(
    ([key, value, introKey, userId]) => {
      const raw = JSON.stringify(value);
      window.localStorage.setItem(key, raw);
      window.sessionStorage.setItem(key, raw);
      window.localStorage.setItem(
        introKey,
        JSON.stringify({
          [`user:${userId}`]: {
            hubs: {
              academy: true,
              launchpad: true,
              vault: true,
              community: true,
            },
          },
        }),
      );
    },
    [SESSION_KEY, LEARNER_SESSION, INTRO_KEY, LEARNER_ID] as const,
  );
  await page.goto("/dashboard/academy");
  const letsGo = page.locator("button", { hasText: "Let's go" });
  if (await letsGo.count()) {
    await letsGo.click({ force: true });
  }
  await expect(page.locator('[aria-label="Academy journey map"]')).toBeVisible({
    timeout: 15_000,
  });
}

async function scrollTop(page: Page) {
  return page.locator("main").evaluate((el) => el.scrollTop);
}

async function resetScroll(page: Page) {
  await page.locator("main").evaluate((el) => {
    el.scrollTop = 0;
  });
}

async function touchDrag(page: Page) {
  const session = await page.context().newCDPSession(page);
  const x = 160;
  const fromY = 420;
  const toY = 140;
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y: fromY, id: 1 }],
  });
  for (let step = 1; step <= 8; step += 1) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: fromY + ((toY - fromY) * step) / 8, id: 1 }],
    });
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await session.detach();
}

test("academy journey scrolls with a mouse wheel and with touch", async ({
  page,
}) => {
  await openAcademy(page);

  for (const { width, height } of VIEWPORTS) {
    await page.setViewportSize({ width, height });
    await resetScroll(page);
    await page.screenshot({
      path: `/opt/cursor/artifacts/academy-journey-${width}-top.png`,
      fullPage: false,
    });
    const before = await scrollTop(page);
    const map = await page.locator('[aria-label="Academy journey map"]').boundingBox();
    expect(map, `map at ${width}`).toBeTruthy();
    await page.mouse.move(
      map!.x + Math.min(120, map!.width / 2),
      Math.min(map!.y + 180, height - 40),
    );
    await page.mouse.wheel(0, 480);
    await expect.poll(() => scrollTop(page)).toBeGreaterThan(before + 100);
    await page.screenshot({
      path: `/opt/cursor/artifacts/academy-journey-${width}-wheel.png`,
      fullPage: false,
    });
  }

  await page.setViewportSize({ width: 375, height: 667 });
  await resetScroll(page);
  const beforeTouch = await scrollTop(page);
  await touchDrag(page);
  await expect.poll(() => scrollTop(page)).toBeGreaterThan(beforeTouch + 40);
  await page.screenshot({
    path: "/opt/cursor/artifacts/academy-journey-375-touch.png",
    fullPage: false,
  });
});
