import { expect, type Page, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const GUEST_SESSION_KEY = "nga_guest_session";
const ARTIFACTS = "/opt/cursor/artifacts";

const EXPLORER_GUEST_SESSION = {
  accessMode: "guest",
  username: "lars",
  ageTier: "explorer",
  curriculumCohort: "explorer",
  accountStatus: "GUEST",
  createdAt: "2026-01-01T00:00:00.000Z",
};

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  video: { mode: "on", size: { width: 390, height: 844 } },
});

async function openLesson(page: Page): Promise<void> {
  mkdirSync(ARTIFACTS, { recursive: true });
  await page.addInitScript(
    ([key, session]) => {
      const raw = JSON.stringify(session);
      window.localStorage.setItem(key, raw);
      window.sessionStorage.setItem(key, raw);
    },
    [GUEST_SESSION_KEY, EXPLORER_GUEST_SESSION] as const,
  );
  await page.goto("/dashboard/academy/lesson/1?recording=1");
  await expect(page).toHaveURL(/\/dashboard\/academy\/lesson\/1/);
  await page.addStyleTag({
    content: "nextjs-portal { display: none !important; }",
  });
}

async function clickNext(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Next", exact: true }).click();
}

async function placeWord(page: Page, word: string): Promise<void> {
  await page.getByRole("button", { name: word, exact: true }).click();
}

async function sortItem(page: Page, item: string, bucket: string): Promise<void> {
  await page.getByRole("button", { name: item, exact: true }).click();
  await page
    .getByRole("button", { name: `Drop selected item in ${bucket}` })
    .click();
}

async function playToClose(page: Page, perfect: boolean): Promise<void> {
  await placeWord(page, "Spent");
  await clickNext(page);

  if (!perfect) {
    await page.getByRole("button", { name: /magically reappears/i }).click();
  }
  await page.getByRole("button", { name: /candy is gone/i }).click();
  await clickNext(page);

  for (const item of [
    "Sour Worms",
    "Cinema Popcorn",
    "Wireless Headphones",
    "Skateboard",
  ]) {
    await page.getByRole("button", { name: item, exact: true }).click();
  }
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeEnabled();
  await clickNext(page);

  await sortItem(page, "Pizza slice", "Short Fun");
  await sortItem(page, "Bubble tea with all the toppings", "Short Fun");
  await sortItem(page, "Gaming controller", "More Fun for Longer");
  await sortItem(page, "Deck of cards", "More Fun for Longer");
  await clickNext(page);

  await page.getByRole("button", { name: /buying fast/i }).click();
  await clickNext(page);

  const hold = page.getByRole("button", { name: /HOLD TO FREEZE/i });
  await hold.scrollIntoViewIfNeeded();
  const box = await hold.boundingBox();
  if (!box) throw new Error("Hold button was not on screen.");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2300);
  await page.mouse.up();
  await clickNext(page);

  await expect(page.getByText(/freeze worked/i)).toBeVisible();
  await clickNext(page);
  await expect(page.getByRole("heading", { name: "You did it!" })).toBeVisible();
}

test("perfect close screen counts up, cashes in, and offers guest sign-up", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await openLesson(page);
  await playToClose(page, true);

  const cashIn = page.getByRole("button", { name: "Cash in coins" });
  await expect(page.getByText("Perfect lesson")).toBeVisible();
  await expect(page.getByText("No mistakes")).toBeVisible();
  await expect(cashIn).toBeEnabled({ timeout: 8_000 });
  await expect(page.locator('[data-lesson-reward-total="150"]')).toBeVisible();
  await page.screenshot({
    path: `${ARTIFACTS}/lesson-close-perfect.png`,
  });

  await cashIn.click();
  await expect(page.getByText("Cashed in ✓")).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
  await expect(page.getByText("Don't lose your achievements!")).toBeVisible();
  await expect(page.locator("a", { hasText: "Create an account" })).toBeVisible();
  await page.screenshot({
    path: `${ARTIFACTS}/lesson-close-guest-popup.png`,
  });
  await page.waitForTimeout(700);
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});

test("plain close screen omits the perfect row", async ({ page }) => {
  test.setTimeout(120_000);
  await openLesson(page);
  await playToClose(page, false);

  const cashIn = page.getByRole("button", { name: "Cash in coins" });
  await expect(cashIn).toBeEnabled({ timeout: 8_000 });
  await expect(page.getByText("Lesson complete")).toBeVisible();
  await expect(page.getByText("Perfect lesson")).toHaveCount(0);
  await expect(page.locator('[data-lesson-reward-total="100"]')).toBeVisible();
  await page.screenshot({
    path: `${ARTIFACTS}/lesson-close-plain.png`,
  });
});
