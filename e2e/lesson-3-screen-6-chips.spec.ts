import { expect, type Page, test } from "@playwright/test";

const CHIPS = [
  "🫙 save",
  "🛍️ spend",
  "💵 cash for emergencies",
  "🤝 borrowed money",
  "🎧 replace",
  "🗑️ throw away",
] as const;

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 375, height: 667 },
] as const;

test.use({ hasTouch: true, isMobile: true });

async function openScreen(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const session = {
      accessMode: "guest",
      username: "explorer",
      ageTier: "explorer",
      curriculumCohort: "explorer",
      accountStatus: "GUEST",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const raw = JSON.stringify(session);
    window.localStorage.setItem("nga_guest_session", raw);
    window.sessionStorage.setItem("nga_guest_session", raw);
    window.sessionStorage.setItem("nga_recording_suppress_intro", "1");
  });
  await page.goto("/dashboard/academy/lesson/3?preview=1&screen=5");
}

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test("word chips stay whole above the footer", async ({ page }) => {
      await openScreen(page);
      await page.getByRole("button", { name: CHIPS[2], exact: true }).waitFor();
      const footer = await page.locator("footer").boundingBox();
      expect(footer).toBeTruthy();
      if (!footer) return;

      for (const label of CHIPS) {
        const button = page.getByRole("button", { name: label, exact: true });
        await button.scrollIntoViewIfNeeded();
        const box = await button.boundingBox();
        expect(box, label).toBeTruthy();
        if (!box) continue;
        expect(box.x, label).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, label).toBeLessThanOrEqual(viewport.width + 1);
        expect(box.y + box.height, label).toBeLessThanOrEqual(footer.y + 1);
        const text = (await button.innerText()).replace(/\s+/g, " ").trim();
        expect(text, label).toBe(label);
        expect(text, label).not.toMatch(/…|\.\.\./);
      }
    });
  });
}
