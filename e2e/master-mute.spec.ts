import { expect, type Locator, type Page, test } from "@playwright/test";

const GUEST_SESSION_KEY = "nga_guest_session";
const MASTER_KEY = "nga_master_muted";
const LEGACY_KEY = "nga_story_audio_muted";

const EXPLORER_GUEST_SESSION = {
  accessMode: "guest",
  username: "lars",
  ageTier: "explorer",
  curriculumCohort: "explorer",
  accountStatus: "GUEST",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const SCREENS: { type: string; lesson: number; screen: number; text: string }[] = [
  { type: "narrative-bonus", lesson: 1, screen: 0, text: "Meet Lars" },
  { type: "word-drop", lesson: 1, screen: 1, text: "right away" },
  { type: "binary-choice", lesson: 1, screen: 2, text: "sour worms" },
  { type: "tap-reveal", lesson: 1, screen: 3, text: "Tap each item" },
  { type: "bucket-sort", lesson: 1, screen: 4, text: "Drag each item" },
  { type: "spotlight-rounds", lesson: 1, screen: 6, text: "RARE SKIN" },
  { type: "hold-to-fill", lesson: 1, screen: 7, text: "buy freeze" },
  { type: "completion", lesson: 1, screen: 10, text: "You did it" },
  { type: "true-false", lesson: 2, screen: 1, text: "phone case" },
  { type: "multiple-choice", lesson: 2, screen: 4, text: "really need" },
  { type: "allocation-slider", lesson: 2, screen: 6, text: "helping Mom" },
  { type: "rank-order", lesson: 2, screen: 7, text: "2-FOR-1" },
  { type: "drag-to-target", lesson: 2, screen: 8, text: "Drag the gift" },
  { type: "link-match", lesson: 3, screen: 3, text: "isn't upset" },
  { type: "savings-goal", lesson: 4, screen: 8, text: "startup money" },
  { type: "skill-hub", lesson: 9, screen: 0, text: "Tap a skill" },
];

type AudioSpy = { playCalls: number; pauseCalls: number };
type PlayedNote = { frequency: number; type: string };

async function installGuest(page: Page, legacyMuted = false): Promise<void> {
  await page.addInitScript(
    ({ sessionKey, session, legacyKey, legacyMuted: startMuted }) => {
      const raw = JSON.stringify(session);
      window.localStorage.setItem(sessionKey, raw);
      window.sessionStorage.setItem(sessionKey, raw);
      if (startMuted) window.localStorage.setItem(legacyKey, "1");

      const spy: AudioSpy = { playCalls: 0, pauseCalls: 0 };
      (window as Window & { __audioSpy?: AudioSpy }).__audioSpy = spy;
      const notes: PlayedNote[] = [];
      (window as Window & { __lessonNotes?: PlayedNote[] }).__lessonNotes = notes;

      const pause = HTMLAudioElement.prototype.pause;
      HTMLAudioElement.prototype.play = function () {
        spy.playCalls += 1;
        this.dispatchEvent(new Event("play"));
        return Promise.resolve();
      };
      HTMLAudioElement.prototype.pause = function () {
        spy.pauseCalls += 1;
        return pause.call(this);
      };

      class FakeAudioContext {
        currentTime = 0;
        destination = {};
        resume() {
          return Promise.resolve();
        }
        close() {
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
    },
    {
      sessionKey: GUEST_SESSION_KEY,
      session: EXPLORER_GUEST_SESSION,
      legacyKey: LEGACY_KEY,
      legacyMuted,
    },
  );
}

function soundButton(page: Page): Locator {
  return page.getByRole("button", { name: /^(Mute sound|Unmute sound)$/ });
}

async function openScreen(page: Page, lesson: number, screen: number, text: string): Promise<void> {
  await page.goto(`/dashboard/academy/lesson/${lesson}?preview=1&screen=${screen}&recording=1`);
  const intro = page.getByRole("button", { name: "Let's go" });
  if (await intro.isVisible().catch(() => false)) await intro.click();
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
  await expect(soundButton(page)).toBeVisible();
}

async function boxOf(button: Locator) {
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

for (const viewport of [
  { name: "390", width: 390, height: 844 },
  { name: "1280", width: 1280, height: 800 },
] as const) {
  test.describe(`master mute ${viewport.name}`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.width < 500,
      isMobile: viewport.width < 500,
    });

    test("stays in the same corner on every screen type, in both states", async ({ page }) => {
      test.setTimeout(180_000);
      await installGuest(page);
      let anchor: { x: number; y: number; width: number; height: number } | null = null;
      for (const screen of SCREENS) {
        await openScreen(page, screen.lesson, screen.screen, screen.text);
        await expect(page.getByRole("button", { name: "Mute voiceover" })).toHaveCount(0);
        await expect(page.getByRole("button", { name: "Unmute voiceover" })).toHaveCount(0);
        const on = page.getByRole("button", { name: "Mute sound", exact: true });
        await expect(on).toBeVisible();
        await expect(on).toHaveAttribute("aria-pressed", "false");
        const onBox = await boxOf(on);
        expect(onBox.width).toBeGreaterThanOrEqual(44);
        expect(onBox.height).toBeGreaterThanOrEqual(44);
        if (!anchor) anchor = onBox;
        else {
          expect(Math.abs(onBox.x - anchor.x)).toBeLessThanOrEqual(4);
          expect(Math.abs(onBox.y - anchor.y)).toBeLessThanOrEqual(4);
          expect(Math.abs(onBox.width - anchor.width)).toBeLessThanOrEqual(1);
          expect(Math.abs(onBox.height - anchor.height)).toBeLessThanOrEqual(1);
        }
        await on.click();
        const off = page.getByRole("button", { name: "Unmute sound", exact: true });
        await expect(off).toBeVisible();
        await expect(off).toHaveAttribute("aria-pressed", "true");
        const offBox = await boxOf(off);
        expect(Math.abs(offBox.x - onBox.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(offBox.y - onBox.y)).toBeLessThanOrEqual(1);
        expect(Math.abs(offBox.width - onBox.width)).toBeLessThanOrEqual(1);
        expect(Math.abs(offBox.height - onBox.height)).toBeLessThanOrEqual(1);
        if (screen.type === "narrative-bonus") {
          await page.screenshot({
            path: `/opt/cursor/artifacts/master-mute-${viewport.name}-muted.png`,
            fullPage: false,
          });
        }
        await off.click();
        await expect(page.getByRole("button", { name: "Mute sound", exact: true })).toBeVisible();
        if (screen.type === "narrative-bonus") {
          await page.screenshot({
            path: `/opt/cursor/artifacts/master-mute-${viewport.name}.png`,
            fullPage: false,
          });
        }
      }
    });
  });
}

test.use({ viewport: { width: 390, height: 844 } });

test("muting pauses narration, unmute stays quiet, and Replay while muted does not unmute", async ({
  page,
}) => {
  await installGuest(page);
  await openScreen(page, 1, 0, "Meet Lars");
  await page.getByRole("button", { name: "Replay", exact: true }).click();
  await expect.poll(async () => page.evaluate(() => (window as Window & { __audioSpy?: AudioSpy }).__audioSpy?.playCalls ?? 0)).toBeGreaterThan(0);
  const playsAfterReplay = await page.evaluate(
    () => (window as Window & { __audioSpy?: AudioSpy }).__audioSpy?.playCalls ?? 0,
  );
  await page.getByRole("button", { name: "Mute sound", exact: true }).click();
  await expect.poll(async () => page.evaluate(() => (window as Window & { __audioSpy?: AudioSpy }).__audioSpy?.pauseCalls ?? 0)).toBeGreaterThan(0);
  const playsWhileMuted = await page.evaluate(
    () => (window as Window & { __audioSpy?: AudioSpy }).__audioSpy?.playCalls ?? 0,
  );
  expect(playsWhileMuted).toBe(playsAfterReplay);
  await page.getByRole("button", { name: "Unmute sound", exact: true }).click();
  expect(
    await page.evaluate(() => (window as Window & { __audioSpy?: AudioSpy }).__audioSpy?.playCalls ?? 0),
  ).toBe(playsAfterReplay);
  await page.getByRole("button", { name: "Mute sound", exact: true }).click();
  await page.getByRole("button", { name: "Replay", exact: true }).click();
  expect(
    await page.evaluate(() => (window as Window & { __audioSpy?: AudioSpy }).__audioSpy?.playCalls ?? 0),
  ).toBe(playsAfterReplay);
  await expect(page.getByRole("button", { name: "Unmute sound", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("a muted lesson skips answer sounds, and the choice is remembered", async ({ page }) => {
  await installGuest(page);
  await openScreen(page, 1, 2, "sour worms");
  await page.getByRole("button", { name: "Mute sound", exact: true }).click();
  await page.getByRole("button", { name: /magically comes back/i }).click();
  expect(
    await page.evaluate(
      () => (window as Window & { __lessonNotes?: PlayedNote[] }).__lessonNotes ?? [],
    ),
  ).toEqual([]);
  await page.reload();
  await expect(page.getByRole("button", { name: "Unmute sound", exact: true })).toBeVisible();
  await page.goto("/dashboard/academy/lesson/2?preview=1&screen=1&recording=1");
  await expect(page.getByText("phone case", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Unmute sound", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(await page.evaluate((key) => window.localStorage.getItem(key), MASTER_KEY)).toBe("1");
  expect(await page.evaluate((key) => window.localStorage.getItem(key), LEGACY_KEY)).toBeNull();
});

test("an old voiceover mute stays muted on the master switch", async ({ page }) => {
  await installGuest(page, true);
  await openScreen(page, 1, 0, "Meet Lars");
  await expect(page.getByRole("button", { name: "Unmute sound", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(await page.evaluate((key) => window.localStorage.getItem(key), MASTER_KEY)).toBe("1");
  expect(await page.evaluate((key) => window.localStorage.getItem(key), LEGACY_KEY)).toBeNull();
});
