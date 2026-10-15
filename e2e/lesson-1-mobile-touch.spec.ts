import { expect, type Locator, type Page, test } from "@playwright/test";

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

async function openLesson(page: Page, path: string): Promise<void> {
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

async function touchPoint(locator: Locator): Promise<{ x: number; y: number }> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error("Touch target was not on screen.");
  return { x: box.x + box.width / 2, y: box.y + Math.min(box.height / 2, 28) };
}

async function touchDrag(page: Page, from: Locator, to: Locator): Promise<void> {
  const start = await touchPoint(from);
  const end = await touchPoint(to);
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: start.x, y: start.y, id: 1 }],
  });
  const steps = 16;
  for (let step = 1; step <= steps; step += 1) {
    const x = start.x + ((end.x - start.x) * step) / steps;
    const y = start.y + ((end.y - start.y) * step) / steps;
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y, id: 1 }],
    });
  }
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await client.detach();
}

test("long-pressing hold to freeze works on touch", async ({ page }) => {
  await openLesson(page, "/dashboard/academy/lesson/1?preview=1&screen=5");
  const hold = page.getByRole("button", { name: /HOLD TO FREEZE/i });
  await expect(hold).toBeVisible();

  const styles = await hold.evaluate(async (element) => {
    const computed = getComputedStyle(element);
    const sheets = [...document.querySelectorAll('link[rel="stylesheet"], style')];
    const css = (
      await Promise.all(
        sheets.map(async (node) => {
          if (node instanceof HTMLStyleElement) return node.textContent ?? "";
          if (!(node instanceof HTMLLinkElement) || !node.href) return "";
          const response = await fetch(node.href);
          return response.ok ? response.text() : "";
        }),
      )
    ).join("\n");
    return {
      touchAction: computed.touchAction,
      userSelect: computed.userSelect,
      webkitUserSelect: computed.getPropertyValue("-webkit-user-select"),
      declaresTouchCallout: css.includes("-webkit-touch-callout: none"),
      hasHoldClass: element.classList.contains("lesson-hold-button"),
    };
  });
  expect(styles.touchAction).toBe("none");
  expect(styles.userSelect).toBe("none");
  expect(styles.webkitUserSelect).toBe("none");
  expect(styles.hasHoldClass).toBe(true);
  expect(styles.declaresTouchCallout).toBe(true);

  const menuPrevented = await hold.evaluate((element) => {
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
    });
    return !element.dispatchEvent(event);
  });
  expect(menuPrevented).toBe(true);

  const point = await touchPoint(hold);
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: point.x, y: point.y, id: 1 }],
  });
  await page.waitForTimeout(2300);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await client.detach();

  await expect(page.getByRole("button", { name: /FROZEN/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeEnabled();
  await page.screenshot({
    path: "/opt/cursor/artifacts/lesson-1-hold-frozen.png",
  });
});

test("show-me card labels stay inside the card", async ({ page }) => {
  await openLesson(page, "/dashboard/academy/lesson/1?preview=1&screen=2");
  await page.getByRole("button", { name: /Show me/i }).tap();
  const label = page
    .getByRole("heading", { name: "More Fun for Longer" })
    .locator("..")
    .getByText("Wireless Headphones", { exact: true });
  await expect(label).toBeVisible({ timeout: 5_000 });

  for (const width of [320, 375, 414]) {
    await page.setViewportSize({ width, height: 667 });
    await expect(label).toBeVisible();
    const fit = await label.evaluate((element) => {
      const card = element.closest("div");
      if (!card) return { fits: false, reason: "missing card" };
      const labelRect = element.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const longestWordFits = element.scrollWidth <= element.clientWidth + 1;
      const insideCard =
        labelRect.left >= cardRect.left - 1 &&
        labelRect.right <= cardRect.right + 1;
      return {
        fits: longestWordFits && insideCard,
        labelWidth: Math.round(labelRect.width),
        cardWidth: Math.round(cardRect.width),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      };
    });
    expect(fit.fits, JSON.stringify({ width, fit })).toBe(true);
  }

  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({
    path: "/opt/cursor/artifacts/lesson-1-headphones-card.png",
  });
});

test("tapping a word chip fills the blank and drag still works", async ({ page }) => {
  const next = page.getByRole("button", { name: "Next", exact: true });

  await openLesson(page, "/dashboard/academy/lesson/1?preview=1&screen=0");
  await expect(next).toBeDisabled();
  await page.getByRole("button", { name: "Spent", exact: true }).tap();
  await expect(page.getByRole("button", { name: /Blank, Spent/i })).toBeVisible();
  await expect(next).toBeEnabled();
  await page.screenshot({
    path: "/opt/cursor/artifacts/lesson-1-word-chip-tap.png",
  });

  await openLesson(page, "/dashboard/academy/lesson/1?preview=1&screen=0");
  await expect(next).toBeDisabled();
  await touchDrag(
    page,
    page.getByRole("button", { name: "Spent", exact: true }),
    page.getByRole("button", { name: /Place the selected word here/i }),
  );
  await expect(page.getByRole("button", { name: /Blank, Spent/i })).toBeVisible();
  await expect(next).toBeEnabled();
});
