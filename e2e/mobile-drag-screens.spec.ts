import { expect, type Locator, type Page, test } from "@playwright/test";

const GUEST_SESSION_KEY = "nga_guest_session";

const EXPLORER_GUEST_SESSION = {
  accessMode: "guest",
  username: "lars",
  birthYear: 2014,
  birthYearLocked: true,
  ageTier: "explorer",
  curriculumCohort: "explorer",
  accountStatus: "GUEST",
  createdAt: "2026-01-01T00:00:00.000Z",
};

test.use({ viewport: { width: 390, height: 844 } });

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

/** Pointer drag, not the tap-to-place shortcut. */
async function dragOnto(page: Page, source: Locator, target: Locator): Promise<void> {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) {
    throw new Error("Drag source or drop zone was not on screen.");
  }
  const startX = from.x + from.width / 2;
  const startY = from.y + Math.min(from.height / 2, 28);
  const endX = to.x + to.width / 2;
  const endY = to.y + Math.min(to.height / 2, 36);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 18 });
  await page.mouse.up();
}

test("mobile drag completes the sentence, sort, swipe, and didn't-buy screens", async ({
  page,
}) => {
  const next = page.getByRole("button", { name: "Next", exact: true });

  await openAsExplorer(page, "/dashboard/academy/lesson/1?preview=1&screen=0");
  await expect(page.getByRole("button", { name: "Spent", exact: true })).toBeVisible();
  await dragOnto(
    page,
    page.getByRole("button", { name: "Spent", exact: true }),
    page.getByRole("button", { name: /Place the selected word here/i }),
  );
  await expect(next).toBeEnabled();

  await openAsExplorer(page, "/dashboard/academy/lesson/4?preview=1&screen=2");
  await expect(page.getByText(/sort their thoughts/i)).toBeVisible();
  const sortPairs = [
    [/need it right now/i, "I'm Rushing"],
    [/left out/i, "I'm Rushing"],
    [/limited time/i, "I'm Rushing"],
    [/ask my friends/i, "I'm Thinking"],
    [/get it cheaper later/i, "I'm Thinking"],
    [/sleep on it/i, "I'm Thinking"],
  ] as const;
  for (const [item, bucket] of sortPairs) {
    await dragOnto(
      page,
      page.getByRole("button", { name: item }),
      page.getByRole("button", { name: `Drop selected item in ${bucket}` }),
    );
  }
  await expect(next).toBeEnabled();

  await openAsExplorer(page, "/dashboard/academy/lesson/4?preview=1&screen=5");
  await expect(page.getByText(/Spend Now/i)).toBeVisible();
  await dragOnto(
    page,
    page.getByRole("button", { name: /Select Spend Now 1/i }),
    page.getByRole("button", { name: /Drop selected Spend Now/i }),
  );
  await expect(next).toBeEnabled();

  await openAsExplorer(page, "/dashboard/academy/lesson/4?preview=1&screen=6");
  await expect(page.getByText(/wheelie workshop/i)).toBeVisible();
  await expect(next).toBeDisabled();
  const dropZone = page.getByRole("heading", { name: "Things Lars didn't buy" });
  for (const item of ["Snacks at school", "Extra lives bundle", "Flashlight"]) {
    await dragOnto(
      page,
      page.getByRole("button", { name: new RegExp(item, "i") }),
      dropZone,
    );
  }
  await expect(page.locator("[aria-live='polite']")).toHaveText("$20");
  await expect(next).toBeEnabled();
});
