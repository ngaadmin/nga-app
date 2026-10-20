import { expect, type Locator, type Page, test } from "@playwright/test";

const GUEST_SESSION_KEY = "nga_guest_session";

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

type Box = { x: number; y: number; width: number; height: number };

async function openLesson(page: Page, path: string): Promise<void> {
  await page.addInitScript(
    ([key, session]) => {
      const raw = JSON.stringify(session);
      window.localStorage.setItem(key, raw);
      window.sessionStorage.setItem(key, raw);
    },
    [
      GUEST_SESSION_KEY,
      {
        accessMode: "guest",
        username: "lars",
        ageTier: "explorer",
        curriculumCohort: "explorer",
        accountStatus: "GUEST",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ] as const,
  );
  await page.goto(path);
}

function closeEnough(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) < 2;
}

async function expectBox(
  locator: Locator,
  expected: Box,
  delta: { x: number; y: number } = { x: 0, y: 0 },
): Promise<void> {
  await expect.poll(async () => {
    const box = await locator.boundingBox();
    if (!box) return false;
    return (
      closeEnough(box.x, expected.x + delta.x) &&
      closeEnough(box.y, expected.y + delta.y) &&
      closeEnough(box.width, expected.width) &&
      closeEnough(box.height, expected.height)
    );
  }).toBe(true);
}

async function expectDragStaysUnderFinger(
  page: Page,
  path: string,
  name: RegExp,
  dropOn?: RegExp,
): Promise<void> {
  await openLesson(page, path);
  const source = page.getByRole("button", { name });
  await expect(source).toBeVisible();
  await source.scrollIntoViewIfNeeded();
  const before = await source.boundingBox();
  if (!before) throw new Error(`Drag source ${name} was not on screen.`);

  const startX = before.x + before.width * 0.3;
  const startY = before.y + before.height * 0.4;
  const delta = { x: 22, y: -14 };
  const client = await page.context().newCDPSession(page);
  const ghost = page.locator("[data-drag-ghost]");
  const picture = ghost.locator("img");

  const held = async () => ((await picture.count()) > 0 ? picture : ghost);

  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: startX, y: startY, id: 1 }],
  });
  await expect(ghost).toBeVisible();
  await expectBox(await held(), before);

  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: startX, y: startY, id: 1 }],
  });
  await expectBox(await held(), before);

  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: startX + delta.x, y: startY + delta.y, id: 1 }],
  });
  await expectBox(await held(), before, delta);

  if (dropOn) {
    const target = page.getByRole("button", { name: dropOn });
    const to = await target.boundingBox();
    if (!to) throw new Error(`Drop target ${dropOn} was not on screen.`);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: to.x + to.width / 2, y: to.y + Math.min(to.height / 2, 48), id: 1 },
      ],
    });
  }

  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await client.detach();

  if (dropOn) {
    await expect(page.getByRole("button", { name: "Next", exact: true })).toBeEnabled();
  }
}

test("gift stays under a touch until the finger actually moves", async ({ page }) => {
  await expectDragStaysUnderFinger(
    page,
    "/dashboard/academy/lesson/2?preview=1&screen=6",
    /Select Gift box 1/i,
    /Drop selected Gift box on Senna/i,
  );
});

test("spend-now coin and gelato share the same drag start", async ({ page }) => {
  await expectDragStaysUnderFinger(
    page,
    "/dashboard/academy/lesson/4?preview=1&screen=5",
    /Select Spend Now 1/i,
  );
  await expectDragStaysUnderFinger(
    page,
    "/dashboard/academy/lesson/7?preview=1&screen=6",
    /Select Gelato 1/i,
  );
});
