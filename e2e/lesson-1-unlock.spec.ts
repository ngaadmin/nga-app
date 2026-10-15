import { expect, type Page, test } from "@playwright/test";

const GUEST_SESSION_KEY = "nga_guest_session";

/** Explorer guest who has already picked a learning track. */
const EXPLORER_GUEST_SESSION = {
  accessMode: "guest",
  username: "lars",
  ageTier: "explorer",
  curriculumCohort: "explorer",
  accountStatus: "GUEST",
  createdAt: "2026-01-01T00:00:00.000Z",
};

async function xpValue(page: Page): Promise<number> {
  const label = await page
    .getByRole("button", { name: /coins/i })
    .first()
    .getAttribute("aria-label");
  const match = label?.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
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

test("finishing lesson 1 unlocks lesson 2 and raises XP", async ({ page }) => {
  await page.addInitScript(
    ([key, session]) => {
      const raw = JSON.stringify(session);
      window.localStorage.setItem(key, raw);
      window.sessionStorage.setItem(key, raw);
    },
    [GUEST_SESSION_KEY, EXPLORER_GUEST_SESSION] as const,
  );

  await page.goto("/dashboard/academy");
  const intro = page.getByRole("button", { name: "Let's go" });
  try {
    await intro.click({ timeout: 4_000 });
  } catch {
    // The first-visit card is skipped once this profile has already seen it.
  }

  await expect(
    page.getByRole("img", { name: "Academy step 2 - Locked" }),
  ).toBeVisible();
  const xpBefore = await xpValue(page);

  await page.goto("/dashboard/academy/lesson/1");
  await expect(page).toHaveURL(/\/dashboard\/academy\/lesson\/1$/);

  await placeWord(page, "Spent");
  await clickNext(page);

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
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeVisible();
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

  await page.getByRole("button", { name: "Cash in your XP" }).click();
  await expect(page.locator('[data-cash-in-celebration="open"]')).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/academy\/lesson\/1$/);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/academy\/?$/, { timeout: 15_000 });
  try {
    await intro.click({ timeout: 4_000 });
  } catch {
    // Already dismissed on the way in.
  }

  await expect(
    page.getByRole("button", { name: "Academy step 2", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Academy step 3 - Locked" }),
  ).toBeVisible();

  await expect.poll(() => xpValue(page)).toBeGreaterThan(xpBefore);
});
