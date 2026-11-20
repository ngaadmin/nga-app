import { expect, type Page, test } from "@playwright/test";
import { DESKTOP, MOBILE, coinsToCashIn, signIn, testAccount } from "./sherlock-helpers";

// Journey 2: a signed-in learner finishes Academy Module 1, lesson 1, sees the
// coins and the completion, and both are still there after a reload.
//
// Account: GlitchTestFresh (Pathfinder track, nga-test only). The test can be
// re-run: a first completion banks the lesson's 160 coins, a replay banks none
// (no double award), so the expected total is worked out from the page state
// before the lesson starts.
//
// Injected-bug check: with INJECT_BREAK=1 the cash-in/save request is aborted
// (test-only, no app change). This test must then FAIL; that failure is
// expected and is not a product bug.
const LESSON_COINS = 160;
const injectBreak = process.env.INJECT_BREAK === "1";

const sizes = [
  { label: "phone 390x844", viewport: MOBILE },
  { label: "desktop 1280x900", viewport: DESKTOP },
];

async function clickNext(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Next", exact: true }).click();
}

async function sortItem(page: Page, item: string, bucket: string): Promise<void> {
  await page.getByRole("button", { name: item }).click();
  await page.getByRole("button", { name: `Drop selected item in ${bucket}` }).click();
}

/** Plays Pathfinder lesson 1 (Holly) up to the cash-in button. */
async function playLesson1ToTheEnd(page: Page): Promise<void> {
  await page.goto("/dashboard/academy/lesson/1");
  await clickNext(page);

  // Fill in the blank: tap the word, then tap the blank.
  await page.getByRole("button", { name: /^spent$/i }).click();
  await page.getByRole("button", { name: /^Blank\. Drag a word here\./ }).click();
  await clickNext(page);

  await page.getByRole("button", { name: /candy is gone/i }).click();
  await clickNext(page);

  for (const item of ["Sour candy", "Doughnut box", "Wireless speaker", "Skateboard"]) {
    await page.getByRole("button", { name: item }).click();
  }
  await clickNext(page);

  await sortItem(page, "Giant bubble tea", "Short Fun");
  await sortItem(page, "Pizza slice", "Short Fun");
  await sortItem(page, "Backpack", "More Fun for Longer");
  await sortItem(page, "Game controller", "More Fun for Longer");
  await clickNext(page);

  await clickNext(page); // story screen
  await page.getByRole("button", { name: /trick her brain into buying fast/i }).click();
  await clickNext(page);

  // Hold the freeze button until it fills, then Next unlocks.
  const hold = page.getByRole("button", { name: /HOLD TO FREEZE/i });
  await hold.scrollIntoViewIfNeeded();
  const box = await hold.boundingBox();
  if (!box) throw new Error("Hold button was not on screen.");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeEnabled({
    timeout: 15_000,
  });
  await page.mouse.up();
  await clickNext(page);

  await expect(page.getByText(/freeze worked/i)).toBeVisible();
  await page.getByRole("button", { name: /keep her \$10 safe/i }).click();
  await clickNext(page);

  await expect(page.getByText(/She decides to start her own business/i)).toBeVisible();
  await clickNext(page);
}

for (const { label, viewport } of sizes) {
  test.describe(`lesson complete, ${label}`, () => {
    test.use({ viewport });

    test("learner finishes lesson 1, sees coins and completion, and it is saved", async ({
      page,
    }) => {
      await signIn(page, testAccount("learner_fresh"));
      const replayStep1 = page.getByRole("button", { name: "Replay Academy step 1", exact: true });
      const alreadyDone = await replayStep1.isVisible();
      const coinsBefore = await coinsToCashIn(page);
      const expectedCoins = coinsBefore + (alreadyDone ? 0 : LESSON_COINS);

      await playLesson1ToTheEnd(page);

      // The finish screen shows the lesson as complete with its coin total.
      await expect(page.getByText("Lesson complete", { exact: true })).toBeVisible();
      await expect(page.getByText(/Skill unlocked: Catch Impulse Spending/)).toBeVisible();
      await expect(page.getByText(`+${LESSON_COINS}`, { exact: true })).toBeVisible();

      if (injectBreak) {
        // Injected break (test only): the save request never reaches the server.
        await page.route("**/dashboard/academy/lesson/1", (route) =>
          route.request().method() === "POST" ? route.abort() : route.continue(),
        );
      }
      const cashIn = page.getByRole("button", { name: "Cash in coins" });
      await expect(cashIn).toBeEnabled({ timeout: 15_000 });
      await cashIn.click();
      await expect(page.getByText("Cashed in ✓")).toBeVisible();
      await page.getByRole("button", { name: "Continue", exact: true }).click();

      // Back on the Academy: coins and completion show.
      await expect(page).toHaveURL(/\/dashboard\/academy\/?$/);
      await expect(replayStep1).toBeVisible();
      await expect(page.getByRole("button", { name: `${expectedCoins} coins to cash in` })).toBeVisible();

      // Reload: the result was saved, not just shown.
      await page.unroute("**/dashboard/academy/lesson/1");
      await page.reload();
      await expect(replayStep1).toBeVisible();
      await expect(page.getByRole("button", { name: `${expectedCoins} coins to cash in` })).toBeVisible();
    });
  });
}
