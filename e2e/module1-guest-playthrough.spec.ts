import { expect, type Locator, type Page, test } from "@playwright/test";

import { createPhase1MilestoneScaffold } from "../lib/dashboard/academy-state";
import {
  applyCashUpdate,
  cashMatches,
  displayCashText,
  type CashComparison,
  type CashUpdate,
} from "../lib/academy/lessons/payload/cash-placeholder";
import { implicitNextIndex } from "../lib/academy/lessons/payload/lesson-graph";
import { loadBundledLessonPayload } from "../lib/academy/lessons/payload/load-lesson-payload";
import { resolvePayloadLesson } from "../lib/academy/lessons/payload/map-payload-lesson";
import type { ScreenConfig } from "../lib/academy/lessons/types";
import type { MasteryCohort } from "../lib/dashboard/mastery-cohort";

const COHORTS: readonly MasteryCohort[] = ["explorer", "pathfinder", "maverick"];
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const GUEST_SESSION_KEY = "nga_guest_session";
const PROGRESS_KEY = "nga_academy_progress_v1";
const RECORDING_KEY = "nga_recording_suppress_intro";

type Choice = {
  label?: string;
  isCorrect?: boolean;
  cashUpdate?: CashUpdate;
  goToIndex?: number;
  showWhen?: CashComparison;
  requiresHubSkills?: readonly string[];
};

type Step = { index: number; cash: number | null };

function choicesOf(screen: ScreenConfig): Choice[] {
  if (!("options" in screen) || !Array.isArray(screen.options)) return [];
  return screen.options.flatMap((option) =>
    option && typeof option === "object" && "label" in option ? [option] : [],
  );
}

function visibleChoices(screen: ScreenConfig, cash: number | null): Choice[] {
  return choicesOf(screen).filter((option) => cashMatches(option.showWhen, cash));
}

function marker(screen: ScreenConfig, cash: number | null): string {
  if (screen.type === "completion") return "You did it!";
  if (screen.type === "word-drop") {
    return (screen.narrativeBefore || screen.narrativeAfter || screen.prompt || "").trim().slice(0, 40);
  }
  let text = "";
  if ("promptWhen" in screen && screen.promptWhen && cash !== null) {
    text = screen.promptWhen.find((item) => cashMatches(item.showWhen, cash))?.text ?? "";
  }
  if (!text && "prompt" in screen && screen.prompt) text = screen.prompt;
  if (!text && "intro" in screen && screen.intro) text = screen.intro;
  if (!text && "narrative" in screen && screen.narrative) text = screen.narrative;
  text = displayCashText(text, cash);
  const line = text.split("\n").map((part) => part.trim()).find(Boolean) ?? text.trim();
  // Story beats render the first sentence as the heading and the rest as a paragraph.
  const sentence = line.split(/(?<=[.!?])\s+/)[0] ?? line;
  return sentence.slice(0, 80);
}

async function clickButton(page: Page, name: string | RegExp): Promise<void> {
  const button = page.getByRole("button", { name, exact: typeof name === "string" }).first();
  await button.scrollIntoViewIfNeeded();
  await button.click();
}

async function dragChipTo(page: Page, source: Locator, target: Locator): Promise<void> {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) throw new Error("Word-drop drag is missing a box.");
  const startX = sourceBox.x + sourceBox.width / 2;
  const startY = sourceBox.y + sourceBox.height / 2;
  const endX = targetBox.x + targetBox.width / 2;
  const endY = targetBox.y + targetBox.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 16 });
  await page.mouse.up();
}

async function footerNext(page: Page): Promise<void> {
  const next = page.getByRole("button", { name: "Next", exact: true }).last();
  await expect(next).toBeEnabled({ timeout: 8_000 });
  await next.click();
}

async function waitForScreen(page: Page, screen: ScreenConfig, cash: number | null): Promise<void> {
  const text = marker(screen, cash);
  if (!text) throw new Error(`No marker for ${screen.type} ${screen.sourceLabel ?? screen.id}`);
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
}

async function missDrag(page: Page, source: Locator, away: Locator): Promise<void> {
  await source.scrollIntoViewIfNeeded();
  await source.dragTo(away, { targetPosition: { x: 8, y: 8 } });
}

async function arrangeRank(
  page: Page,
  labels: readonly string[],
): Promise<void> {
  for (let target = 0; target < labels.length; target += 1) {
    const label = labels[target] ?? "";
    for (let guard = 0; guard < labels.length + 1; guard += 1) {
      const current = await page.getByRole("button", { name: /^Reorder:/ }).evaluateAll((nodes) =>
        nodes.map((node) =>
          (node.getAttribute("aria-label") ?? "").replace(/^Reorder:\s*/, ""),
        ),
      );
      const from = current.indexOf(label);
      if (from === target) break;
      const handle = page.getByRole("button", { name: `Reorder: ${label}`, exact: true });
      await handle.focus();
      await handle.press(from > target ? "ArrowUp" : "ArrowDown");
    }
  }
}

async function playScreen(
  page: Page,
  screen: ScreenConfig,
  index: number,
  labels: readonly string[],
  cash: number | null,
): Promise<Step> {
  const fallthrough = (): Step => ({
    index:
      typeof screen.continueToIndex === "number"
        ? screen.continueToIndex
        : implicitNextIndex(index, labels),
    cash,
  });

  if (screen.type === "word-drop") {
    const blanks =
      screen.blanks && screen.blanks.length > 0
        ? screen.blanks
        : [{ options: screen.options, correctOption: screen.correctOption }];
    const distractor = screen.options.find(
      (option) => !blanks.some((blank) => blank.correctOption === option),
    );
    if (distractor) {
      await dragChipTo(
        page,
        page.getByRole("button", { name: distractor, exact: true }),
        page.locator("[data-word-drop-slot='0']"),
      );
      const placed = page.getByRole("button", {
        name: `Blank, ${distractor}`,
        exact: true,
      });
      await expect(placed).toBeVisible();
      await dragChipTo(page, placed, page.locator("#word-drop-bank"));
    }
    for (const [slot, blank] of blanks.entries()) {
      await dragChipTo(
        page,
        page.getByRole("button", { name: blank.correctOption, exact: true }),
        page.locator(`[data-word-drop-slot='${slot}']`),
      );
    }
    await footerNext(page);
    return fallthrough();
  }

  if (screen.type === "true-false") {
    await clickButton(page, screen.correctAnswer === "true" ? "False" : "True");
    await page.waitForTimeout(400);
    await clickButton(page, screen.correctAnswer === "true" ? "True" : "False");
    await footerNext(page);
    return fallthrough();
  }

  if (screen.type === "binary-choice" || screen.type === "multiple-choice") {
    if (screen.continueToLabel) {
      await clickButton(page, "Continue");
      return fallthrough();
    }
    const options = visibleChoices(screen, cash);
    if (screen.decisionPath || screen.skillHub) {
      const choice = options[0];
      if (!choice?.label) throw new Error(`No choice on ${screen.sourceLabel}`);
      await clickButton(page, choice.label);
      await footerNext(page);
      return {
        index: choice.goToIndex ?? implicitNextIndex(index, labels),
        cash: choice.cashUpdate ? applyCashUpdate(cash, choice.cashUpdate) : cash,
      };
    }
    const correct = options.filter((option) => option.isCorrect);
    const neutral = options.find(
      (option) => !option.isCorrect && /all of the above/i.test(correct[0]?.label ?? ""),
    );
    const wrong = options.find((option) => option.isCorrect !== true);
    if (neutral?.label && screen.wrongError.trim()) {
      await clickButton(page, neutral.label);
      await expect(page.getByText(screen.wrongError, { exact: false }).first()).toBeVisible();
    } else if (wrong?.label) {
      await clickButton(page, wrong.label);
      await page.waitForTimeout(400);
    }
    for (const option of correct) {
      if (!option.label) continue;
      await clickButton(page, option.label);
    }
    const chosen = correct[0];
    await footerNext(page);
    return {
      index: chosen?.goToIndex ?? fallthrough().index,
      cash: chosen?.cashUpdate ? applyCashUpdate(cash, chosen.cashUpdate) : cash,
    };
  }

  if (screen.type === "tap-reveal") {
    for (const item of screen.items) {
      await clickButton(page, item.label);
    }
    await clickButton(page, "Next");
    return fallthrough();
  }

  if (screen.type === "bucket-sort") {
    if (screen.layout === "steps-row") {
      const first = screen.items[0];
      const wrongStep = screen.buckets.find((bucket) => bucket.id !== first?.bucket);
      if (first && wrongStep) {
        const card = page.getByRole("button", { name: first.label, exact: true });
        await card.dragTo(page.getByLabel(wrongStep.label));
        await expect(card).toBeVisible();
      }
      for (const item of screen.items) {
        const bucket = screen.buckets.find((entry) => entry.id === item.bucket);
        await page
          .getByRole("button", { name: item.label, exact: true })
          .dragTo(page.getByLabel(bucket?.label ?? "Step 1"));
      }
    } else {
      let missed = false;
      for (const item of screen.items) {
        await clickButton(page, item.label);
        const wrong = screen.buckets.find((bucket) => bucket.id !== item.bucket);
        if (!missed && wrong) {
          await clickButton(page, `Drop selected item in ${wrong.label}`);
          await page.waitForTimeout(400);
          await clickButton(page, item.label);
          missed = true;
        }
        const bucket = screen.buckets.find((entry) => entry.id === item.bucket);
        await clickButton(page, `Drop selected item in ${bucket?.label ?? ""}`);
      }
    }
    await footerNext(page);
    return fallthrough();
  }

  if (screen.type === "spotlight-rounds") {
    if (screen.decisionPath) {
      const choice = visibleChoices(screen, cash)[0];
      if (!choice?.label) throw new Error(`No branch on ${screen.sourceLabel}`);
      await clickButton(page, choice.label);
      await footerNext(page);
      return {
        index: choice.goToIndex ?? implicitNextIndex(index, labels),
        cash: choice.cashUpdate ? applyCashUpdate(cash, choice.cashUpdate) : cash,
      };
    }
    let missed = false;
    for (const round of screen.rounds) {
      const wrong = round.correct === "a" ? round.optionB : round.optionA;
      const right = round.correct === "a" ? round.optionA : round.optionB;
      if (!missed) {
        await clickButton(page, wrong);
        await page.waitForTimeout(420);
        missed = true;
      }
      await clickButton(page, right);
      if (round !== screen.rounds[screen.rounds.length - 1]) {
        await page.waitForTimeout(500);
      }
    }
    await footerNext(page);
    return fallthrough();
  }

  if (screen.type === "rank-order") {
    const wanted = screen.correctOrder.map(
      (id) => screen.items.find((item) => item.id === id)?.label ?? id,
    );
    const current = await page.getByRole("button", { name: /^Reorder:/ }).evaluateAll((nodes) =>
      nodes.map((node) => (node.getAttribute("aria-label") ?? "").replace(/^Reorder:\s*/, "")),
    );
    const next = page.getByRole("button", { name: "Next", exact: true }).last();
    if (current.join("|") === wanted.join("|") && wanted.length > 1) {
      const handle = page.getByRole("button", { name: `Reorder: ${wanted[0]}`, exact: true });
      await handle.focus();
      await handle.press("ArrowDown");
    }
    await expect(next).toBeDisabled();
    await arrangeRank(page, wanted);
    await expect(next).toBeDisabled();
    await clickButton(page, "Check order");
    await footerNext(page);
    return fallthrough();
  }

  if (screen.type === "link-match") {
    const [first, ...rest] = screen.pairs;
    const mismatch = rest.find((pair) => pair.benefit !== first?.benefit);
    if (first && mismatch) {
      await clickButton(page, first.event);
      await clickButton(page, mismatch.benefit);
      await page.waitForTimeout(400);
    }
    for (const pair of screen.pairs) {
      await clickButton(page, pair.event);
      await clickButton(page, pair.benefit);
    }
    await footerNext(page);
    return fallthrough();
  }

  if (screen.type === "allocation-slider") {
    const slider = page.getByRole("slider", { name: "Save amount" });
    await slider.scrollIntoViewIfNeeded();
    const box = await slider.boundingBox();
    if (!box) throw new Error("Save slider was not on screen.");
    const atLeast = screen.match === "at-least";
    // KEEP accepts the target or more. A move or pay screen stays exact.
    await page.mouse.click(box.x + box.width - 36, box.y + box.height - 28);
    const settled = Number(await slider.getAttribute("aria-valuenow"));
    if (!atLeast && settled === screen.targetMin) {
      await slider.press("ArrowRight");
    }
    if (!atLeast && screen.sliderError.trim()) {
      await expect(page.getByText(screen.sliderError, { exact: false }).first()).toBeVisible();
    }
    await slider.focus();
    for (let step = 0; step < screen.total + 2; step += 1) {
      const now = Number(await slider.getAttribute("aria-valuenow"));
      if (atLeast ? now >= screen.targetMin : now === screen.targetMin) break;
      await slider.press(now > screen.targetMin ? "ArrowLeft" : "ArrowRight");
    }
    const landed = Number(await slider.getAttribute("aria-valuenow"));
    if (atLeast) {
      expect(landed).toBeGreaterThanOrEqual(screen.targetMin);
    } else {
      expect(landed).toBe(screen.targetMin);
    }
    await footerNext(page);
    return fallthrough();
  }

  if (screen.type === "budget-select") {
    const wrong = screen.items.find((item) => !screen.correctIds.includes(item.id));
    if (wrong) {
      await clickButton(page, new RegExp(wrong.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      await page.waitForTimeout(420);
    }
    for (const id of screen.correctIds) {
      const item = screen.items.find((entry) => entry.id === id);
      if (!item) continue;
      await clickButton(page, new RegExp(item.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    await footerNext(page);
    return fallthrough();
  }

  if (screen.type === "hold-to-fill") {
    const hold = page.getByRole("button", { name: /HOLD TO/i });
    await hold.scrollIntoViewIfNeeded();
    const box = await hold.boundingBox();
    if (!box) throw new Error("Hold button was not on screen.");
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForTimeout(180);
    await page.mouse.up();
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForTimeout(2300);
    await page.mouse.up();
    await footerNext(page);
    return fallthrough();
  }

  if (screen.type === "drag-to-target") {
    const source = page.getByRole("button", {
      name: new RegExp(`Select ${screen.sourceLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
    }).first();
    await missDrag(page, source, page.getByText(marker(screen, cash), { exact: false }).first());
    await source.click();
    await clickButton(
      page,
      `Drop selected ${screen.sourceLabel} on ${screen.targetLabel}`,
    );
    await footerNext(page);
    return fallthrough();
  }

  if (screen.type === "savings-goal") {
    const first = screen.items[0];
    if (first) {
      const chip = page.getByRole("button", { name: new RegExp(first.label) }).first();
      await missDrag(page, chip, page.getByText(screen.meterLabel, { exact: false }).first());
      if (screen.wrongError?.trim()) {
        await expect(page.getByText(screen.wrongError, { exact: false }).first()).toBeVisible();
      }
    }
    for (const item of screen.items) {
      const chip = page.getByRole("button", { name: new RegExp(item.label) }).first();
      await chip.dragTo(page.getByRole("heading", { name: screen.dropZoneLabel, exact: true }));
    }
    await footerNext(page);
    return fallthrough();
  }

  if (screen.type === "narrative-bonus") {
    await footerNext(page);
    return fallthrough();
  }

  if (screen.type === "skill-hub") {
    let runningCash = cash;
    for (const skill of screen.skills) {
      await clickButton(page, skill.label);
      const start = skill.goToIndex ?? index + 1;
      const played = await playRange(page, labels, start, index, runningCash);
      runningCash = played.cash;
      await waitForScreen(page, screen, runningCash);
    }
    const finish = page.getByRole("button", { name: screen.finishLabel, exact: true });
    await expect(finish).toBeEnabled();
    await finish.click();
    return { index: screen.finishToIndex ?? index + 1, cash: runningCash };
  }

  throw new Error(`No guest player for ${screen.type}`);
}

async function playRange(
  page: Page,
  labels: readonly string[],
  start: number,
  until: number,
  cash: number | null,
): Promise<Step> {
  const content = pageContent(page);
  let index = start;
  let runningCash = cash;
  for (let guard = 0; guard < 40 && index !== until; guard += 1) {
    const screen = content.screens[index];
    if (!screen || screen.type === "completion") break;
    await waitForScreen(page, screen, runningCash);
    const step = await playScreen(page, screen, index, labels, runningCash);
    index = step.index;
    runningCash = step.cash;
  }
  return { index, cash: runningCash };
}

const contentByPage = new WeakMap<Page, { screens: readonly ScreenConfig[] }>();

function pageContent(page: Page): { screens: readonly ScreenConfig[] } {
  const content = contentByPage.get(page);
  if (!content) throw new Error("Lesson content was not attached to this page.");
  return content;
}

async function assertMedals(page: Page, lesson: number): Promise<void> {
  await expect(page.getByRole("heading", { name: "You did it!" })).toBeVisible();
  await expect(page.locator('img[src*="medal-skill"]')).toHaveCount(0);
  const medals = page.locator("[data-completion-medals]");
  if (lesson >= 1 && lesson <= 3) {
    await expect(medals).toHaveAttribute(
      "data-completion-medals",
      `medal-skill${lesson}-bronze`,
    );
    return;
  }
  if (lesson >= 4 && lesson <= 6) {
    await expect(medals).toHaveAttribute(
      "data-completion-medals",
      `medal-skill${lesson - 3}-silver`,
    );
    return;
  }
  if (lesson === 9) {
    await expect(medals).toHaveAttribute(
      "data-completion-medals",
      "medal-skill1-gold medal-skill2-gold medal-skill3-gold",
    );
    return;
  }
  await expect(medals).toHaveCount(0);
}

async function playLesson(page: Page, lesson: number, cohort: MasteryCohort): Promise<void> {
  const content = resolvePayloadLesson(loadBundledLessonPayload(1, lesson), cohort, lesson);
  contentByPage.set(page, content);
  const labels = content.screens.map((screen) => screen.sourceLabel ?? screen.id);
  const milestones = createPhase1MilestoneScaffold(lesson);
  const session = {
    accessMode: "guest",
    username: cohort,
    ageTier: cohort,
    curriculumCohort: cohort,
    accountStatus: "GUEST",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
  await page.addInitScript(
    ({ sessionKey, progressKey, recordingKey, sessionValue, progressValue }) => {
      window.sessionStorage.setItem(sessionKey, sessionValue);
      window.localStorage.setItem(sessionKey, sessionValue);
      window.sessionStorage.setItem(progressKey, progressValue);
      window.localStorage.setItem(progressKey, progressValue);
      window.sessionStorage.setItem(recordingKey, "1");
    },
    {
      sessionKey: GUEST_SESSION_KEY,
      progressKey: PROGRESS_KEY,
      recordingKey: RECORDING_KEY,
      sessionValue: JSON.stringify(session),
      progressValue: JSON.stringify(milestones),
    },
  );

  await page.goto(`/dashboard/academy/lesson/${lesson}?recording=1`);
  const intro = page.getByRole("button", { name: "Let's go" });
  try {
    await intro.click({ timeout: 2_000 });
  } catch {
    // Recording mode keeps the first-visit card closed.
  }

  let index = 0;
  let cash: number | null = null;
  for (let guard = 0; guard < 50; guard += 1) {
    const screen = content.screens[index];
    if (!screen) throw new Error(`Missing screen ${index}`);
    await waitForScreen(page, screen, cash);
    if (screen.type === "completion") {
      await assertMedals(page, lesson);
      const cashIn = page.getByRole("button", { name: "Cash in coins" });
      await expect(cashIn).toBeEnabled();
      const reward = Number(
        await page.locator("[data-lesson-reward-total]").getAttribute("data-lesson-reward-total"),
      );
      const starting = Number(
        await page.locator("[data-coin-balance]").first().getAttribute("data-coin-balance"),
      );
      await cashIn.click();
      await expect(page.locator('[data-cash-in-celebration="open"]')).toBeVisible();
      if (lesson === 2) {
        expect(reward).toBeGreaterThan(0);
        const expected = starting + reward;
        await expect(page.locator("[data-coin-balance]").first()).toHaveAttribute(
          "data-coin-balance",
          String(expected),
          { timeout: 8_000 },
        );
        const guestPrompt = page.getByText("Keep exploring in Guest Mode");
        await guestPrompt.waitFor({ state: "attached", timeout: 8_000 }).catch(() => undefined);
        if (await guestPrompt.count()) {
          await guestPrompt.click({ force: true });
          await expect(page.getByRole("dialog")).toHaveCount(0);
        }
        await page.getByRole("button", { name: "Continue", exact: true }).click();
        await expect(page).toHaveURL(/\/dashboard\/academy\/?(?:\?.*)?$/);
        await expect(page.locator("[data-coin-balance]").first()).toHaveAttribute(
          "data-coin-balance",
          String(expected),
        );
        await page.reload();
        await expect(page.locator("[data-coin-balance]").first()).toHaveAttribute(
          "data-coin-balance",
          String(expected),
        );
      }
      return;
    }
    const step = await playScreen(page, screen, index, labels, cash);
    index = step.index;
    cash = step.cash;
  }
  throw new Error(`Lesson ${lesson} did not reach completion.`);
}

for (const cohort of COHORTS) {
  for (const lesson of LESSONS) {
    test(`guest ${cohort} plays module 1 lesson ${lesson}`, async ({ page }) => {
      test.setTimeout(180_000);
      await playLesson(page, lesson, cohort);
    });
  }
}
