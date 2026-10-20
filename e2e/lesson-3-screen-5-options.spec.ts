import { expect, type Page, test } from "@playwright/test";

const GUEST_SESSION_KEY = "nga_guest_session";

const TRACKS = [
  {
    cohort: "explorer",
    options: [
      "Buy the toy and save $10 more next week.",
      "Buy the headphones to fix what she broke first.",
      "Buy the toy and hope the headphones don't cost $40.",
    ],
  },
  {
    cohort: "pathfinder",
    options: [
      "Buy the craft bundle and save $10 more next week.",
      "Buy the headphones to fix what she broke first.",
      "Buy the craft bundle and hope the headphones don't cost $40.",
    ],
  },
  {
    cohort: "maverick",
    options: [
      "Buy the game and save $20 more next week.",
      "Buy the headphones to fix what he broke first.",
      "Buy the game and hope the headphones don't cost $40.",
    ],
  },
] as const;

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 375, height: 667 },
] as const;

test.use({ hasTouch: true, isMobile: true });

async function openScreen(page: Page, cohort: string): Promise<void> {
  await page.addInitScript((track) => {
    const session = {
      accessMode: "guest",
      username: track,
      ageTier: track,
      curriculumCohort: track,
      accountStatus: "GUEST",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const raw = JSON.stringify(session);
    window.localStorage.setItem("nga_guest_session", raw);
    window.sessionStorage.setItem("nga_guest_session", raw);
    window.sessionStorage.setItem("nga_recording_suppress_intro", "1");
  }, cohort);
  await page.goto("/dashboard/academy/lesson/3?preview=1&screen=4");
}

async function assertOptionWraps(page: Page, label: string): Promise<void> {
  const button = page.getByRole("button", { name: label, exact: true });
  await button.scrollIntoViewIfNeeded();
  const box = await button.boundingBox();
  const footer = await page.locator("footer").boundingBox();
  expect(box, label).toBeTruthy();
  expect(footer, label).toBeTruthy();
  if (!box || !footer) return;
  expect(box.y, label).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height, label).toBeLessThanOrEqual(footer.y + 1);

  const metrics = await button.evaluate((node) => {
    const text = node.querySelector("span.min-w-0");
    const style = text ? getComputedStyle(text) : null;
    return {
      label: (text?.textContent ?? "").replace(/\s+/g, " ").trim(),
      scrollHeight: text?.scrollHeight ?? 0,
      clientHeight: text?.clientHeight ?? 0,
      scrollWidth: text?.scrollWidth ?? 0,
      clientWidth: text?.clientWidth ?? 0,
      lineClamp: style?.webkitLineClamp ?? "none",
      textOverflow: style?.textOverflow ?? "clip",
      whiteSpace: style?.whiteSpace ?? "normal",
    };
  });
  expect(metrics.label, label).toBe(label);
  expect(metrics.label, label).not.toMatch(/…|\.\.\./);
  expect(metrics.lineClamp, label).toBe("none");
  expect(metrics.textOverflow, label).not.toBe("ellipsis");
  expect(metrics.whiteSpace, label).not.toBe("nowrap");
  expect(metrics.scrollHeight, label).toBeLessThanOrEqual(metrics.clientHeight + 1);
  expect(metrics.scrollWidth, label).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    for (const track of TRACKS) {
      test(`${track.cohort} long answers stay whole`, async ({ page }) => {
        await openScreen(page, track.cohort);
        await page.getByRole("button", { name: track.options[2], exact: true }).waitFor();
        for (const label of track.options) {
          await assertOptionWraps(page, label);
        }
      });
    }
  });
}
