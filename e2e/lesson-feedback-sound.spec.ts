import { expect, type Page, test } from "@playwright/test";

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

type PlayedNote = { frequency: number; type: string };

test.use({ viewport: { width: 390, height: 844 } });

async function openLesson(page: Page, path: string): Promise<void> {
  await page.addInitScript(
    ([key, session]) => {
      const raw = JSON.stringify(session);
      window.localStorage.setItem(key, raw);
      window.sessionStorage.setItem(key, raw);

      const notes: PlayedNote[] = [];
      const vibrations: number[][] = [];
      (window as Window & { __lessonNotes?: PlayedNote[] }).__lessonNotes = notes;
      (window as Window & { __lessonVibrations?: number[][] }).__lessonVibrations =
        vibrations;

      class FakeAudioContext {
        currentTime = 0;
        destination = {};
        resume() {
          return Promise.resolve();
        }
        createOscillator() {
          const osc = {
            type: "sine",
            frequency: { value: 0 },
            connect() {},
            start() {
              notes.push({ frequency: osc.frequency.value, type: osc.type });
            },
            stop() {},
          };
          return osc;
        }
        createGain() {
          return {
            gain: {
              setValueAtTime() {},
              exponentialRampToValueAtTime() {},
            },
            connect() {},
          };
        }
      }

      window.AudioContext = FakeAudioContext as unknown as typeof AudioContext;
      const vibrate = (pattern: VibratePattern | Iterable<number>) => {
        const values = typeof pattern === "number" ? [pattern] : [...pattern];
        vibrations.push(values);
        return true;
      };
      navigator.vibrate = vibrate;
    },
    [GUEST_SESSION_KEY, EXPLORER_GUEST_SESSION] as const,
  );
  await page.goto(path);
}

async function playedNotes(page: Page): Promise<PlayedNote[]> {
  return page.evaluate(
    () =>
      (window as Window & { __lessonNotes?: PlayedNote[] }).__lessonNotes ?? [],
  );
}

async function vibrations(page: Page): Promise<number[][]> {
  return page.evaluate(
    () =>
      (window as Window & { __lessonVibrations?: number[][] }).__lessonVibrations ??
      [],
  );
}

test("answer sounds play on the tap, and Next stays quiet", async ({
  page,
}) => {
  await openLesson(page, "/dashboard/academy/lesson/1?preview=1&screen=1");
  const next = page.getByRole("button", { name: "Next", exact: true });
  await expect(next).toBeDisabled();

  await page.getByRole("button", { name: /magically reappears/i }).click();
  await expect(page.getByText(/once you trade your cash/i)).toBeVisible();
  await expect(page.locator('[role="status"] span')).toHaveCount(0);
  expect(await playedNotes(page)).toEqual([
    { frequency: 180, type: "square" },
    { frequency: 110, type: "square" },
  ]);
  expect(await vibrations(page)).toEqual([[60, 40, 60]]);
  await expect(next).toBeDisabled();

  await page.getByRole("button", { name: /candy is gone/i }).click();
  await expect(page.locator('[role="status"] span')).toBeVisible();
  expect(await playedNotes(page)).toEqual([
    { frequency: 180, type: "square" },
    { frequency: 110, type: "square" },
    { frequency: 880, type: "sine" },
  ]);
  await expect(next).toBeEnabled();
  await next.click();
  expect(await playedNotes(page)).toEqual([
    { frequency: 180, type: "square" },
    { frequency: 110, type: "square" },
    { frequency: 880, type: "sine" },
  ]);
  expect(await vibrations(page)).toEqual([[60, 40, 60]]);

  await openLesson(page, "/dashboard/academy/lesson/1?preview=1&screen=0");
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Saved", exact: true }).click();
  await page.getByRole("button", { name: /Place the selected word here/i }).click();
  expect(await playedNotes(page)).toEqual([
    { frequency: 180, type: "square" },
    { frequency: 110, type: "square" },
  ]);
  expect(await vibrations(page)).toEqual([[60, 40, 60]]);
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();

  await page.getByRole("button", { name: "Spent", exact: true }).click();
  await page.getByRole("button", { name: /Place the selected word here/i }).click();
  await expect(page.locator('[role="status"] span')).toBeVisible();
  expect(await playedNotes(page)).toEqual([
    { frequency: 180, type: "square" },
    { frequency: 110, type: "square" },
    { frequency: 880, type: "sine" },
  ]);
  const sentenceNext = page.getByRole("button", { name: "Next", exact: true });
  await expect(sentenceNext).toBeEnabled();
  await sentenceNext.click();
  expect(await playedNotes(page)).toEqual([
    { frequency: 180, type: "square" },
    { frequency: 110, type: "square" },
    { frequency: 880, type: "sine" },
  ]);

  await openLesson(page, "/dashboard/academy/lesson/4?preview=1&screen=2");
  await page.getByRole("button", { name: /limited time offer/i }).click();
  await expect(page.getByText(/that thought is rushing you/i)).toBeVisible();
  expect(await playedNotes(page)).toEqual([
    { frequency: 180, type: "square" },
    { frequency: 110, type: "square" },
  ]);
  expect(await vibrations(page)).toEqual([[60, 40, 60]]);
  await page.getByRole("button", { name: /cheaper later/i }).click();
  await expect(page.locator('[role="status"] span')).toBeVisible();
  expect(await playedNotes(page)).toEqual([
    { frequency: 180, type: "square" },
    { frequency: 110, type: "square" },
    { frequency: 880, type: "sine" },
  ]);
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
});
