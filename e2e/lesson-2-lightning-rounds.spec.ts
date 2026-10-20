import { expect, type Locator, type Page, test } from "@playwright/test";

type Track = "explorer" | "pathfinder" | "maverick";

const GUEST_SESSION_KEY = "nga_guest_session";
const SCREENSHOT_DIR = "/opt/cursor/artifacts/lesson-2-lightning";

type Round = {
  left: string;
  right: string;
  correct: string;
  emojiFor: Record<string, string>;
};

const ROUNDS: Record<Track, readonly Round[]> = {
  explorer: [
    {
      left: "A new phone case, even though his old one is still fine",
      right: "A new phone case he promised his brother",
      correct: "A new phone case he promised his brother",
      emojiFor: {
        "A new phone case, even though his old one is still fine": "📱",
        "A new phone case he promised his brother": "🎁",
      },
    },
    {
      left: "A light for his bike to be seen in the dark",
      right: "A new gaming mouse with lights (his old one still works)",
      correct: "A light for his bike to be seen in the dark",
      emojiFor: {
        "A light for his bike to be seen in the dark": "💡",
        "A new gaming mouse with lights (his old one still works)": "🖱️",
      },
    },
    {
      left: "Buy lunch for all his friends and have nothing left",
      right: "A bus pass to get him to uni",
      correct: "A bus pass to get him to uni",
      emojiFor: {
        "Buy lunch for all his friends and have nothing left": "🍱",
        "A bus pass to get him to uni": "🚍",
      },
    },
  ],
  pathfinder: [
    {
      left: "A new phone case, even though her old one is still fine",
      right: "A new phone case she promised her sister",
      correct: "A new phone case she promised her sister",
      emojiFor: {
        "A new phone case, even though her old one is still fine": "📱",
        "A new phone case she promised her sister": "🎁",
      },
    },
    {
      left: "A new lead for her dog as the old one broke",
      right: "A new hoodie that everyone at school has",
      correct: "A new lead for her dog as the old one broke",
      emojiFor: {
        "A new lead for her dog as the old one broke": "🐕",
        "A new hoodie that everyone at school has": "🧥",
      },
    },
    {
      left: "Buy lunch for all her friends and have nothing left",
      right: "Buy lunch at school with her tuckshop money",
      correct: "Buy lunch at school with her tuckshop money",
      emojiFor: {
        "Buy lunch for all her friends and have nothing left": "🍱",
        "Buy lunch at school with her tuckshop money": "🥪",
      },
    },
  ],
  maverick: [],
};

ROUNDS.maverick = ROUNDS.explorer;

const PROMPT: Record<Track, RegExp> = {
  explorer: /Which item is the one Lars 'Needs'/,
  pathfinder: /Which item is the one Holly 'Needs'/,
  maverick: /Which item is the one Aiden 'Needs'/,
};

test.use({
  viewport: { width: 390, height: 844 },
});

function guestSession(cohort: Track) {
  return {
    accessMode: "guest",
    username: "lars",
    ageTier: cohort,
    curriculumCohort: cohort,
    accountStatus: "GUEST",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function optionButton(page: Page, label: string): Locator {
  return page.getByRole("button", { name: label, exact: true });
}

/** Circle choices sit in one row. Stacked cards are full width and do not overlap vertically this way. */
async function expectTwoColumnEmojiRound(page: Page, round: Round): Promise<void> {
  const left = optionButton(page, round.left);
  const right = optionButton(page, round.right);
  await expect(left).toBeVisible();
  await expect(right).toBeVisible();
  await expect(left.locator("span[aria-hidden]")).toHaveText(round.emojiFor[round.left] ?? "");
  await expect(right.locator("span[aria-hidden]")).toHaveText(round.emojiFor[round.right] ?? "");

  const leftBox = await left.boundingBox();
  const rightBox = await right.boundingBox();
  expect(leftBox).not.toBeNull();
  expect(rightBox).not.toBeNull();
  if (!leftBox || !rightBox) return;

  const sideBySide =
    leftBox.x + leftBox.width <= rightBox.x + 1 || rightBox.x + rightBox.width <= leftBox.x + 1;
  expect(sideBySide).toBe(true);
  const sharedHeight =
    Math.min(leftBox.y + leftBox.height, rightBox.y + rightBox.height) - Math.max(leftBox.y, rightBox.y);
  expect(sharedHeight).toBeGreaterThan(40);
  expect(leftBox.width).toBeLessThan(160);
  expect(rightBox.width).toBeLessThan(160);

  const gridClass = await left.evaluate((element) => {
    let node = element.parentElement;
    while (node) {
      if (node.classList.contains("grid-cols-2")) return node.className;
      node = node.parentElement;
    }
    return "";
  });
  expect(gridClass).toContain("grid-cols-2");
}

for (const cohort of ["explorer", "pathfinder", "maverick"] as const) {
  test(`lesson 2 lightning rounds stay in two columns for ${cohort}`, async ({ page }) => {
    await page.addInitScript(
      ([key, session]) => {
        const raw = JSON.stringify(session);
        window.localStorage.setItem(key, raw);
        window.sessionStorage.setItem(key, raw);
      },
      [GUEST_SESSION_KEY, guestSession(cohort)] as const,
    );
    await page.goto("/dashboard/academy/lesson/2?preview=1&screen=2");
    await expect(page.getByText(PROMPT[cohort])).toBeVisible();

    const rounds = ROUNDS[cohort];
    for (let index = 0; index < rounds.length; index += 1) {
      const round = rounds[index]!;
      await expectTwoColumnEmojiRound(page, round);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/${cohort}-round-${index + 1}.png`,
      });
      await optionButton(page, round.correct).click();
      const next = rounds[index + 1];
      if (next) {
        await expect(optionButton(page, next.left)).toBeVisible();
      }
    }
  });
}
