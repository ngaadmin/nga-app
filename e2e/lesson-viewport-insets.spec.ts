import { expect, type Page, test } from "@playwright/test";

const GUEST_SESSION_KEY = "nga_guest_session";

const MAVERICK_GUEST_SESSION = {
  accessMode: "guest",
  username: "senna",
  ageTier: "maverick",
  curriculumCohort: "maverick",
  accountStatus: "GUEST",
  createdAt: "2026-01-01T00:00:00.000Z",
};

async function openLesson(page: Page): Promise<void> {
  await page.addInitScript(
    ([key, session]) => {
      const raw = JSON.stringify(session);
      window.localStorage.setItem(key, raw);
      window.sessionStorage.setItem(key, raw);
    },
    [GUEST_SESSION_KEY, MAVERICK_GUEST_SESSION] as const,
  );
  await page.goto("/dashboard/academy/lesson/1?preview=1");
  await expect(page.getByRole("link", { name: "Close lesson" })).toBeVisible();
}

for (const viewport of [
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]) {
  test.describe(`lesson frame at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport, hasTouch: true, isMobile: true });

    test("header sits at the top and Next is fully on screen", async ({ page }) => {
      await openLesson(page);

      const frame = await page.evaluate(() => {
        const box = (el: Element | null) => {
          const r = el?.getBoundingClientRect();
          return r ? { top: r.top, bottom: r.bottom } : null;
        };
        const next = [...document.querySelectorAll("footer button")].find(
          (b) => b.textContent?.trim() === "Next",
        );
        return {
          innerHeight: window.innerHeight,
          viewport: box(document.querySelector("[data-lesson-viewport]")),
          header: box(document.querySelector("header")),
          next: box(next ?? null),
          htmlBg: getComputedStyle(document.documentElement).backgroundColor,
          bodyBg: getComputedStyle(document.body).backgroundColor,
          position: getComputedStyle(
            document.querySelector("[data-lesson-viewport]") as Element,
          ).position,
        };
      });

      expect(frame.position).toBe("fixed");
      expect(frame.viewport?.top).toBe(0);
      expect(frame.viewport?.bottom).toBe(frame.innerHeight);
      // No band above the lesson header.
      expect(frame.header?.top ?? 99).toBeLessThanOrEqual(1);
      // The page behind the lesson is white, never the light-blue app panel.
      expect(frame.htmlBg).toBe("rgb(255, 255, 255)");
      expect(frame.bodyBg).toBe("rgb(255, 255, 255)");
      // Next is whole and clear of the bottom edge.
      expect(frame.next).toBeTruthy();
      expect(frame.next!.bottom).toBeLessThanOrEqual(frame.innerHeight - 12);
    });
  });
}
