import { expect, type Locator, type Page, test } from "@playwright/test";

type Track = "explorer" | "pathfinder" | "maverick";

const GUEST_SESSION_KEY = "nga_guest_session";

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
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

async function openRankScreen(page: Page, cohort: Track): Promise<void> {
  await page.addInitScript(
    ([key, session]) => {
      const raw = JSON.stringify(session);
      window.localStorage.setItem(key, raw);
      window.sessionStorage.setItem(key, raw);
    },
    [GUEST_SESSION_KEY, guestSession(cohort)] as const,
  );
  await page.goto("/dashboard/academy/lesson/2?preview=1&screen=5");
}

async function touchDrag(page: Page, from: Locator, to: Locator): Promise<void> {
  await from.scrollIntoViewIfNeeded();
  await to.scrollIntoViewIfNeeded();
  const startBox = await from.boundingBox();
  const endBox = await to.boundingBox();
  if (!startBox || !endBox) throw new Error("Rank row was not on screen.");
  const start = { x: startBox.x + startBox.width / 2, y: startBox.y + startBox.height / 2 };
  const movingUp = start.y > endBox.y;
  const end = {
    x: endBox.x + endBox.width / 2,
    y: movingUp ? endBox.y + 6 : endBox.y + endBox.height - 6,
  };
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...start, id: 1 }],
  });
  const steps = 24;
  for (let step = 1; step <= steps; step += 1) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: start.x + ((end.x - start.x) * step) / steps,
          y: start.y + ((end.y - start.y) * step) / steps,
          id: 1,
        },
      ],
    });
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
}

function rows(page: Page): Locator {
  return page.getByRole("button", { name: /^Reorder:/ });
}

async function rowLabels(page: Page): Promise<string[]> {
  return rows(page).evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("aria-label") ?? ""),
  );
}

/** Move each choice into best-to-avoid order with touch drags. */
async function arrangeBestFirst(page: Page): Promise<void> {
  const wanted = [/keep the \$\d+/i, /cheaper/i, /borrow/i];
  for (let index = 0; index < wanted.length; index += 1) {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const labels = await rowLabels(page);
      const from = labels.findIndex((label) => wanted[index]!.test(label));
      if (from === index) break;
      if (from < 0) throw new Error(`Missing rank row ${wanted[index]}`);
      await touchDrag(page, rows(page).nth(from), rows(page).nth(index));
    }
    await expect.poll(async () => (await rowLabels(page))[index] ?? "").toMatch(wanted[index]!);
  }
}

for (const cohort of ["explorer", "pathfinder", "maverick"] as const) {
  test(`lesson 2 screen 6 is passable for ${cohort} with touch drags`, async ({ page }) => {
    await openRankScreen(page, cohort);
    const intro =
      cohort === "pathfinder" ? /Holly has only/i : cohort === "maverick" ? /Aiden has only/i : /Lars has only/i;
    await expect(page.getByText(intro)).toBeVisible();
    await expect(rows(page)).toHaveCount(3);
    await expect(page.getByText("⋮⋮")).toHaveCount(0);
    const next = page.getByRole("button", { name: "Next", exact: true });
    await expect(next).toBeDisabled();

    await page.getByRole("button", { name: "Check order" }).click();
    await expect(next).toBeDisabled();

    await arrangeBestFirst(page);
    await expect(page.getByRole("button", { name: "Check order" })).toBeVisible();
    await expect(next).toBeDisabled();
    await page.getByRole("button", { name: "Check order" }).click();
    await expect(next).toBeEnabled();
  });
}
