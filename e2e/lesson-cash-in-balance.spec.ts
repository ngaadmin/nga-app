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
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

async function openLesson(page: Page): Promise<void> {
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

async function playToClose(page: Page): Promise<void> {
  await placeWord(page, "Spent");
  await clickNext(page);

  await page.getByRole("button", { name: /magically reappears/i }).click();
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

async function coinBalance(page: Page): Promise<number> {
  const raw = await page
    .locator("[data-coin-balance]")
    .first()
    .getAttribute("data-coin-balance");
  const balance = Number(raw);
  if (!Number.isFinite(balance)) {
    throw new Error(`Coin balance was not a number: ${raw}`);
  }
  return balance;
}

test("cash in updates the coin total and keeps it after reload", async ({ page }) => {
  test.setTimeout(180_000);
  await openLesson(page);
  await playToClose(page);

  const cashIn = page.getByRole("button", { name: "Cash in coins" });
  await expect(cashIn).toBeEnabled({ timeout: 8_000 });
  const reward = Number(
    await page.locator("[data-lesson-reward-total]").getAttribute("data-lesson-reward-total"),
  );
  expect(reward).toBeGreaterThan(0);
  const starting = await coinBalance(page);
  const expected = starting + reward;

  await cashIn.click();
  await expect(page.locator("[data-coin-balance]").first()).toHaveAttribute(
    "data-coin-balance",
    String(expected),
    { timeout: 8_000 },
  );
  await expect(page.locator("[data-coin-counter]").first()).toContainText(
    expected.toLocaleString(),
  );
  await expect(page.getByText("Cashed in ✓")).toBeVisible();

  const guestPrompt = page.getByText("Keep exploring in Guest Mode");
  await guestPrompt.waitFor({ state: "attached", timeout: 8_000 }).catch(() => undefined);
  if (await guestPrompt.count()) {
    await guestPrompt.click({ force: true });
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/academy\/?(?:\?.*)?$/);
  await expect(page.locator("[data-coin-balance]").first()).toHaveAttribute(
    "data-coin-balance",
    String(expected),
  );

  await page.reload();
  await expect(page.locator("[data-coin-balance]").first()).toHaveAttribute(
    "data-coin-balance",
    String(expected),
  );
  await expect(page.locator("[data-coin-counter]").first()).toContainText(
    expected.toLocaleString(),
  );
});
