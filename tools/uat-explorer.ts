import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { chromium, webkit, type Browser, type Page, type Locator } from "playwright";

import { academyLaunchName, parseUatArgs, type ViewportName } from "@/tools/uat-explorer-args";

import { createPhase1MilestoneScaffold } from "@/lib/dashboard/academy-state";
import {
  applyCashUpdate,
  cashMatches,
  type CashComparison,
  type CashUpdate,
} from "@/lib/academy/lessons/payload/cash-placeholder";
import { implicitNextIndex } from "@/lib/academy/lessons/payload/lesson-graph";
import { loadExplorerM1Payload } from "@/lib/academy/lessons/payload/explorer-m1/load-explorer-m1-payload";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import type { ScreenConfig } from "@/lib/academy/lessons/types";

const OUT = "/opt/cursor/artifacts/explorer-m1-uat";
mkdirSync(OUT, { recursive: true });

type Choice = {
  label?: string;
  isCorrect?: boolean;
  cashUpdate?: CashUpdate;
  goToIndex?: number;
  showWhen?: CashComparison;
  requiresHubSkills?: readonly string[];
};

type Step = { index: number; cash: number | null };

type Bug = {
  id: string;
  severity: "blocker" | "major" | "minor";
  lesson: number;
  screen: number;
  words: string;
  title: string;
  detail: string;
  shot?: string;
};

const bugs: Bug[] = [];
const passed: number[] = [];
const failedLessons: { lesson: number; viewport: string; error: string }[] = [];

function wordsOf(screen: ScreenConfig): string {
  const raw =
    ("narrative" in screen && screen.narrative) ||
    ("prompt" in screen && screen.prompt) ||
    ("intro" in screen && screen.intro) ||
    "";
  return String(raw).replace(/\s+/g, " ").trim().split(/\s+/).slice(0, 10).join(" ");
}

function marker(screen: ScreenConfig, cash: number | null): string {
  if (screen.type === "completion") return "You did it!";
  if (screen.type === "word-drop") {
    return (screen.narrativeBefore || screen.narrativeAfter || screen.prompt || "").trim().slice(0, 50);
  }
  let text = "";
  if ("promptWhen" in screen && screen.promptWhen && cash !== null) {
    text = screen.promptWhen.find((item) => cashMatches(item.showWhen, cash))?.text ?? "";
  }
  if (!text && "prompt" in screen && screen.prompt) text = screen.prompt;
  if (!text && "intro" in screen && screen.intro) text = screen.intro;
  if (!text && "narrative" in screen && screen.narrative) text = screen.narrative;
  text = text.replace(/\{cash\}/g, cash === null ? "" : `$${cash}`);
  const line = text.split("\n").map((part) => part.trim()).find(Boolean) ?? text.trim();
  const sentence = line.split(/(?<=[.!?])\s+/)[0] ?? line;
  return sentence.slice(0, 90);
}

function choicesOf(screen: ScreenConfig): Choice[] {
  if (!("options" in screen) || !Array.isArray(screen.options)) return [];
  return screen.options.flatMap((option) =>
    option && typeof option === "object" && "label" in option ? [option as Choice] : [],
  );
}

function visibleChoices(screen: ScreenConfig, cash: number | null): Choice[] {
  return choicesOf(screen).filter((option) => cashMatches(option.showWhen, cash));
}

const contentByPage = new WeakMap<Page, { screens: readonly ScreenConfig[] }>();

function pageContent(page: Page): { screens: readonly ScreenConfig[] } {
  const content = contentByPage.get(page);
  if (!content) throw new Error("Lesson content was not attached.");
  return content;
}

function namePattern(name: string): RegExp {
  return new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
}

async function clickButton(page: Page, name: string | RegExp): Promise<void> {
  const button = page.getByRole("button", { name: typeof name === "string" ? namePattern(name) : name }).first();
  await button.scrollIntoViewIfNeeded();
  await button.click();
}

async function dragChipTo(page: Page, source: Locator, target: Locator): Promise<void> {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) throw new Error("Drag is missing a box.");
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 16 });
  await page.mouse.up();
}

async function footerNext(page: Page): Promise<void> {
  const next = page.locator("button").filter({ hasText: /^Next$/ }).last();
  await next.waitFor({ state: "attached", timeout: 8_000 });
  const started = Date.now();
  while (Date.now() - started < 8_000) {
    if (await next.isEnabled()) break;
    await page.waitForTimeout(100);
  }
  if (!(await next.isEnabled())) {
    const text = await page.locator("body").innerText().catch(() => "");
    throw new Error(`Next stayed disabled on ${page.url()} :: ${text.replace(/\s+/g, " ").slice(0, 240)}`);
  }
  await next.click();
}

async function waitForScreen(page: Page, screen: ScreenConfig, cash: number | null): Promise<void> {
  const text = marker(screen, cash);
  if (!text) throw new Error(`No marker for ${screen.type} ${screen.id}`);
  await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout: 12_000 });
}

async function arrangeRank(page: Page, labels: readonly string[]): Promise<void> {
  for (let target = 0; target < labels.length; target += 1) {
    const label = labels[target] ?? "";
    for (let guard = 0; guard < labels.length + 2; guard += 1) {
      const current = await page.getByRole("button", { name: /^Reorder:/ }).evaluateAll((nodes) =>
        nodes.map((node) => (node.getAttribute("aria-label") ?? "").replace(/^Reorder:\s*/, "")),
      );
      const from = current.indexOf(label);
      if (from === target) break;
      const handle = page.getByRole("button", { name: `Reorder: ${label}`, exact: true });
      await handle.focus();
      await handle.press(from > target ? "ArrowUp" : "ArrowDown");
    }
  }
}

async function shot(page: Page, name: string): Promise<string> {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

function addBug(bug: Bug): void {
  if (bugs.some((item) => item.id === bug.id && item.lesson === bug.lesson && item.screen === bug.screen)) return;
  bugs.push(bug);
  console.log(`BUG ${bug.severity} L${bug.lesson} s${bug.screen} ${bug.title}`);
}

async function playScreen(
  page: Page,
  screen: ScreenConfig,
  index: number,
  labels: readonly string[],
  cash: number | null,
): Promise<Step> {
  const fallthrough = (): Step => ({
    index: typeof screen.continueToIndex === "number" ? screen.continueToIndex : implicitNextIndex(index, labels),
    cash,
  });

  if (screen.type === "word-drop") {
    const blanks =
      screen.blanks && screen.blanks.length > 0
        ? screen.blanks
        : [{ options: screen.options, correctOption: screen.correctOption }];
    const distractor = screen.options.find((option) => !blanks.some((blank) => blank.correctOption === option));
    if (distractor) {
      await dragChipTo(page, page.getByRole("button", { name: distractor, exact: true }), page.locator("[data-word-drop-slot='0']"));
      const placed = page.getByRole("button", { name: `Blank, ${distractor}. Return to the word bank.`, exact: true });
      await placed.waitFor({ state: "visible", timeout: 4_000 });
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
    await page.waitForTimeout(350);
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
      if (!choice?.label) throw new Error(`No choice on ${screen.id}`);
      await clickButton(page, choice.label);
      await footerNext(page);
      return {
        index: choice.goToIndex ?? implicitNextIndex(index, labels),
        cash: choice.cashUpdate ? applyCashUpdate(cash, choice.cashUpdate) : cash,
      };
    }
    const correct = options.filter((option) => option.isCorrect);
    const wrong = options.find((option) => option.isCorrect !== true);
    if (wrong?.label) {
      await clickButton(page, wrong.label);
      await page.waitForTimeout(350);
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
    for (const item of screen.items) await clickButton(page, item.label);
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
      }
      for (const item of screen.items) {
        const bucket = screen.buckets.find((entry) => entry.id === item.bucket);
        await page.getByRole("button", { name: item.label, exact: true }).dragTo(page.getByLabel(bucket?.label ?? "Step 1"));
      }
    } else {
      let missed = false;
      for (const item of screen.items) {
        await clickButton(page, item.label);
        const wrong = screen.buckets.find((bucket) => bucket.id !== item.bucket);
        if (!missed && wrong) {
          await clickButton(page, `Drop selected item in ${wrong.label}`);
          await page.waitForTimeout(300);
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
      if (!choice?.label) throw new Error(`No branch on ${screen.id}`);
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
        await page.waitForTimeout(400);
        missed = true;
      }
      await clickButton(page, right);
      if (round !== screen.rounds[screen.rounds.length - 1]) await page.waitForTimeout(450);
    }
    await footerNext(page);
    return fallthrough();
  }

  if (screen.type === "rank-order") {
    const wanted = screen.correctOrder.map((id) => screen.items.find((item) => item.id === id)?.label ?? id);
    const current = await page.getByRole("button", { name: /^Reorder:/ }).evaluateAll((nodes) =>
      nodes.map((node) => (node.getAttribute("aria-label") ?? "").replace(/^Reorder:\s*/, "")),
    );
    const next = page.getByRole("button", { name: "Next", exact: true }).last();
    if (current.join("|") === wanted.join("|") && wanted.length > 1) {
      const handle = page.getByRole("button", { name: `Reorder: ${wanted[0]}`, exact: true });
      await handle.focus();
      await handle.press("ArrowDown");
    }
    await arrangeRank(page, wanted);
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
      await page.waitForTimeout(300);
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
    await slider.focus();
    const atLeast = screen.match === "at-least";
    for (let step = 0; step < screen.total + 2; step += 1) {
      const now = Number(await slider.getAttribute("aria-valuenow"));
      if (atLeast ? now >= screen.targetMin : now === screen.targetMin) break;
      await slider.press(now > screen.targetMin ? "ArrowLeft" : "ArrowRight");
    }
    await footerNext(page);
    return fallthrough();
  }

  if (screen.type === "budget-select") {
    const wrong = screen.items.find((item) => !screen.correctIds.includes(item.id));
    if (wrong) {
      await clickButton(page, new RegExp(wrong.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      await page.waitForTimeout(300);
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
    const holdKey = async (ms: number) => {
      await hold.focus();
      await page.keyboard.down(" ");
      await page.waitForTimeout(ms);
      await page.keyboard.up(" ");
    };
    // A short release is a miss. The button shakes, so the real hold uses
    // the keyboard path the screen already accepts.
    await holdKey(180);
    await page.waitForTimeout(500);
    await holdKey(2600);
    await footerNext(page);
    return fallthrough();
  }

  if (screen.type === "drag-to-target") {
    const source = page.getByRole("button", {
      name: new RegExp(`Select ${screen.sourceLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
    }).first();
    await source.click();
    await clickButton(page, `Drop selected ${screen.sourceLabel} on ${screen.targetLabel}`);
    await footerNext(page);
    return fallthrough();
  }

  if (screen.type === "savings-goal") {
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
    await clickButton(page, screen.finishLabel);
    return { index: screen.finishToIndex ?? index + 1, cash: runningCash };
  }

  throw new Error(`No player for ${screen.type}`);
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

async function inspectImages(
  page: Page,
  lesson: number,
  index: number,
  screen: ScreenConfig,
  viewport: string,
): Promise<void> {
  const broken = (await page.evaluate(`(() => {
    const imgs = [...document.querySelectorAll("img")];
    const wait = imgs.map((img) => new Promise((resolve) => {
      const finish = () => {
        const src = img.currentSrc || img.src || "";
        if (!src.includes("/assets/")) {
          resolve(null);
          return;
        }
        const box = img.getBoundingClientRect();
        if (!img.complete || img.naturalWidth === 0 || box.width < 8 || box.height < 8) {
          resolve(src + " (" + Math.round(box.width) + "x" + Math.round(box.height) + ", natural " + img.naturalWidth + ")");
          return;
        }
        resolve(null);
      };
      if (img.complete) finish();
      else {
        img.addEventListener("load", finish, { once: true });
        img.addEventListener("error", finish, { once: true });
        setTimeout(finish, 5000);
      }
    }));
    return Promise.all(wait).then((rows) => rows.filter(Boolean));
  })()`)) as string[];
  const leakedName = await page.locator("body").innerText().then(
    (text) => /\b(?:sidebyside|chatting)\b/i.test(text),
    () => false,
  );
  if (broken.length > 0 || leakedName) {
    const file = await shot(page, `bug-broken-img-l${lesson}-s${index}-${viewport}`);
    addBug({
      id: `broken-img-${lesson}-${index}`,
      severity: "major",
      lesson,
      screen: index,
      words: wordsOf(screen),
      title: leakedName ? "Image file name is on screen" : "Image failed to load",
      detail: leakedName
        ? `A picture file name is visible. ${broken.join(", ")}`
        : broken.join(", "),
      shot: file,
    });
  }
}

async function inspectBeat(page: Page, lesson: number, index: number, screen: ScreenConfig, viewport: string): Promise<void> {
  if (screen.type !== "narrative-bonus" || !screen.audio) return;
  const credit = page.getByText("Voice created with Grok", { exact: true });
  const count = await credit.count();
  const expectCredit = Boolean(screen.credit);
  if (expectCredit && count !== 1) {
    const file = await shot(page, `bug-credit-missing-l${lesson}-s${index}-${viewport}`);
    addBug({
      id: `credit-missing-${lesson}-${index}`,
      severity: "major",
      lesson,
      screen: index,
      words: wordsOf(screen),
      title: "Credit missing on the first voiced beat",
      detail: `Expected one “Voice created with Grok”, found ${count}.`,
      shot: file,
    });
  }
  if (!expectCredit && count > 0) {
    const file = await shot(page, `bug-credit-repeat-l${lesson}-s${index}-${viewport}`);
    addBug({
      id: `credit-repeat-${lesson}-${index}`,
      severity: "major",
      lesson,
      screen: index,
      words: wordsOf(screen),
      title: "Credit repeated on a later beat",
      detail: `This beat should not show the credit. Found ${count}.`,
      shot: file,
    });
  }
  const replay = page.getByRole("button", { name: "Replay", exact: true });
  if ((await replay.count()) === 0) {
    const file = await shot(page, `bug-no-replay-l${lesson}-s${index}-${viewport}`);
    addBug({
      id: `no-replay-${lesson}-${index}`,
      severity: "major",
      lesson,
      screen: index,
      words: wordsOf(screen),
      title: "Replay control missing on a voiced beat",
      detail: "A story beat with audio did not show Replay.",
      shot: file,
    });
  }
  if (!("pairImage" in screen) || !screen.pairImage) {
    const brief = screen.illustration?.label ?? "";
    if (brief && (await page.getByText(brief, { exact: false }).count()) > 0) {
      const file = await shot(page, `bug-brief-visible-l${lesson}-s${index}-${viewport}`);
      addBug({
        id: `brief-visible-${lesson}-${index}`,
        severity: "major",
        lesson,
        screen: index,
        words: wordsOf(screen),
        title: "Image brief is shown because the beat has no picture",
        detail: `Visible brief: ${brief}`,
        shot: file,
      });
    }
  }
  const next = page.getByRole("button", { name: "Next", exact: true }).last();
  const box = await next.boundingBox();
  const viewportSize = page.viewportSize();
  if (box && viewportSize && (box.y + box.height > viewportSize.height + 2 || box.y < 0)) {
    const file = await shot(page, `bug-next-offscreen-l${lesson}-s${index}-${viewport}`);
    addBug({
      id: `next-offscreen-${lesson}-${index}-${viewport}`,
      severity: "major",
      lesson,
      screen: index,
      words: wordsOf(screen),
      title: "Next is outside the viewport",
      detail: `Next box y=${Math.round(box.y)} h=${Math.round(box.height)} viewport=${viewportSize.height}`,
      shot: file,
    });
  }
}

async function leaveIfStuck(
  page: Page,
  lesson: number,
  index: number,
  screen: ScreenConfig,
  viewport: string,
): Promise<boolean> {
  const before = marker(screen, null);
  await footerNext(page);
  const left = await page
    .waitForURL(/\/dashboard\/academy\/?(?:\?.*)?$/, { timeout: 8_000 })
    .then(() => true)
    .catch(() => false);
  if (left) return false;
  const still = await page.getByText(before, { exact: false }).first().isVisible().catch(() => false);
  const url = page.url();
  if (!/\/lesson\//.test(url)) return false;
  if (still) {
    const file = await shot(page, `bug-next-stuck-l${lesson}-s${index}-${viewport}`);
    addBug({
      id: `next-stuck-${lesson}-${index}`,
      severity: "blocker",
      lesson,
      screen: index,
      words: wordsOf(screen),
      title: "Next does nothing on the last story beat",
      detail: "Pressed Next after the beat was readable. The same text stayed on screen and the lesson did not close.",
      shot: file,
    });
    await page.getByRole("link", { name: "Close lesson" }).click();
    await page.waitForURL(/\/dashboard\/academy\/?(?:\?.*)?$/, { timeout: 8_000 });
    return true;
  }
  const file = await shot(page, `bug-next-no-exit-l${lesson}-s${index}-${viewport}`);
  addBug({
    id: `next-no-exit-${lesson}-${index}`,
    severity: "blocker",
    lesson,
    screen: index,
    words: wordsOf(screen),
    title: "Next left the beat text but did not return to Academy",
    detail: `URL ${url}`,
    shot: file,
  });
  return true;
}

const BASE = "http://127.0.0.1:3000";
const VIEWPORTS: Record<ViewportName, { width: number; height: number }> = {
  phone: { width: 390, height: 844 },
  desktop: { width: 1280, height: 800 },
};

type WatchBag = {
  responses: string[];
  consoleErrors: string[];
};

let shotPending = false;

function guestInitScript(activeLesson: number): string {
  const milestones = createPhase1MilestoneScaffold(activeLesson);
  const session = {
    accessMode: "guest",
    username: "lars",
    ageTier: "explorer",
    curriculumCohort: "explorer",
    accountStatus: "GUEST",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
  const sessionValue = JSON.stringify(JSON.stringify(session));
  const progressValue = JSON.stringify(JSON.stringify(milestones));
  return `(() => {
    const sessionValue = ${sessionValue};
    const progressValue = ${progressValue};
    window.sessionStorage.setItem("nga_guest_session", sessionValue);
    window.localStorage.setItem("nga_guest_session", sessionValue);
    window.sessionStorage.setItem("nga_academy_progress_v1", progressValue);
    window.localStorage.setItem("nga_academy_progress_v1", progressValue);
    window.sessionStorage.setItem("nga_recording_suppress_intro", "1");
    HTMLAudioElement.prototype.play = function () {
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    };
    window.localStorage.setItem(
      "nga_page_intro_seen_by_account_v1",
      JSON.stringify({ "guest:lars": { hubs: { academy: true } } }),
    );
  })();`;
}

function watchPage(page: Page): WatchBag & { stop: () => void } {
  const bag: WatchBag = { responses: [], consoleErrors: [] };
  const onResponse = (response: { url: () => string; status: () => number }) => {
    const url = response.url();
    const status = response.status();
    if (status >= 400 && /academy-audio|illustrations|webp|mp3/.test(url)) {
      bag.responses.push(`${status} ${url}`);
    }
  };
  const onConsole = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === "error") bag.consoleErrors.push(msg.text());
  };
  const onPageError = (error: Error) => {
    bag.consoleErrors.push(String(error));
  };
  page.on("response", onResponse);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  return {
    ...bag,
    stop() {
      page.off("response", onResponse);
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
    },
  };
}

function lessonContent(lesson: number) {
  const payload = loadExplorerM1Payload(lesson);
  if (!payload) throw new Error(`missing payload ${lesson}`);
  return resolvePayloadLesson(payload, "explorer", lesson);
}

async function dismissIntro(page: Page): Promise<void> {
  const intro = page.getByRole("button", { name: "Let's go" });
  if (await intro.isVisible().catch(() => false)) await intro.click();
}

async function openLessonDirect(page: Page, lesson: number): Promise<void> {
  await page.goto(`${BASE}/dashboard/academy/lesson/${lesson}?recording=1`, {
    waitUntil: "domcontentloaded",
  });
  await dismissIntro(page);
}

async function openLessonFromMap(page: Page, lesson: number): Promise<void> {
  await page.waitForURL(/\/dashboard\/academy\/?(?:\?.*)?$/, { timeout: 12_000 });
  await dismissIntro(page);
  const step = page.getByRole("button", { name: academyLaunchName(lesson), exact: true });
  await step.waitFor({ state: "attached", timeout: 15_000 });
  await step.scrollIntoViewIfNeeded();
  await step.click();
  await page.waitForURL(new RegExp(`/lesson/${lesson}(?:\\?|$)`), { timeout: 15_000 });
  await dismissIntro(page);
}

function noteWatch(lesson: number, viewport: string, index: number, bag: WatchBag): void {
  if (bag.responses.length > 0) {
    addBug({
      id: `http-${lesson}-${viewport}-${bag.responses[0]}`,
      severity: "major",
      lesson,
      screen: index,
      words: "",
      title: "Image or audio request failed",
      detail: bag.responses.slice(0, 8).join("\n"),
    });
  }
  const interesting = bag.consoleErrors.filter(
    (line) => !/favicon|Download the React DevTools|data-recording|Hydration|hydration/.test(line),
  );
  if (interesting.length > 0) {
    addBug({
      id: `console-${lesson}-${viewport}`,
      severity: "minor",
      lesson,
      screen: index,
      words: "",
      title: "Console error during the lesson",
      detail: interesting.slice(0, 6).join("\n"),
    });
  }
}

async function walkLoadedLesson(page: Page, lesson: number, viewport: string, bag: WatchBag): Promise<void> {
  const content = lessonContent(lesson);
  contentByPage.set(page, content);
  const labels = content.screens.map((screen) => screen.sourceLabel ?? screen.id);
  let index = 0;
  let cash: number | null = null;
  let mutedChecked = false;
  let finished = false;
  for (let guard = 0; guard < 80; guard += 1) {
    const screen = content.screens[index];
    if (!screen) throw new Error(`Missing screen ${index}`);
    await waitForScreen(page, screen, cash);
    if (lesson === 2 && index === 0) {
      const file = `/opt/cursor/artifacts/l2-first-screen-${viewport}.png`;
      await page.screenshot({ path: file, fullPage: false });
      console.log(`shot ${file}`);
    }
    if (shotPending && index === 0) {
      const file = `/opt/cursor/artifacts/check-quick-l${lesson}-${viewport}.png`;
      await page.screenshot({ path: file, fullPage: false });
      console.log(`shot ${file}`);
      shotPending = false;
    }
    if (index === 0 && !mutedChecked) {
      const mute = page.getByRole("button", { name: /^(Mute sound|Unmute sound)$/ });
      const visible = await mute.isVisible().catch(() => false);
      if (!visible) {
        const file = await shot(page, `bug-mute-missing-l${lesson}-${viewport}`);
        addBug({
          id: `mute-missing-${lesson}`,
          severity: "major",
          lesson,
          screen: index,
          words: wordsOf(screen),
          title: "Master mute button is missing",
          detail: "Every lesson screen needs the sound button in the top-right of the lesson column.",
          shot: file,
        });
      }
      mutedChecked = true;
    }
    await inspectImages(page, lesson, index, screen, viewport);
    if (screen.type === "narrative-bonus" && screen.audio) {
      await inspectBeat(page, lesson, index, screen, viewport);
    }
    if (screen.type === "completion") {
      const cashIn = page.getByRole("button", { name: /Cash in/i });
      await cashIn.waitFor({ state: "visible", timeout: 8_000 });
      const readyAt = Date.now();
      while (Date.now() - readyAt < 8_000 && !(await cashIn.isEnabled())) {
        await page.waitForTimeout(150);
      }
      await cashIn.click();
      const guest = page.getByText("Keep exploring in Guest Mode");
      if (await guest.isVisible().catch(() => false)) {
        await guest.click();
      } else {
        await guest.waitFor({ state: "visible", timeout: 2_000 }).then(() => guest.click()).catch(() => undefined);
      }
      const continueButton = page.getByRole("button", { name: "Continue", exact: true });
      await continueButton.click();
      const nextScreen = content.screens[index + 1];
      if (!nextScreen) {
        await page.waitForURL(/\/dashboard\/academy\/?(?:\?.*)?$/, { timeout: 8_000 });
        const audio = await page.evaluate(() =>
          [...document.querySelectorAll("audio")].map((node) => ({
            src: (node as HTMLAudioElement).src,
            paused: (node as HTMLAudioElement).paused,
          })),
        );
        if (audio.some((item) => item.src && !item.paused)) {
          const file = await shot(page, `bug-audio-after-leave-l${lesson}-${viewport}`);
          addBug({
            id: `audio-after-leave-${lesson}`,
            severity: "major",
            lesson,
            screen: index,
            words: "You did it!",
            title: "Audio kept playing after leaving the lesson",
            detail: JSON.stringify(audio),
            shot: file,
          });
        }
        finished = true;
        break;
      }
      index += 1;
      continue;
    }
    if (index === content.screens.length - 1 && screen.type === "narrative-bonus") {
      const stuck = await leaveIfStuck(page, lesson, index, screen, viewport);
      if (stuck && lesson === 1) {
        await page.goto(`${BASE}/dashboard/academy/lesson/1?recording=1`, {
          waitUntil: "domcontentloaded",
        });
        const again = page.getByText("Meet Lars.", { exact: false }).first();
        const reopened = await again.isVisible().catch(() => false);
        if (!reopened) {
          const file = await shot(page, `bug-reopen-l1-${viewport}`);
          addBug({
            id: "reopen-l1",
            severity: "major",
            lesson: 1,
            screen: 0,
            words: "Meet Lars.",
            title: "Reopening lesson 1 did not show the intro",
            detail: `URL ${page.url()}`,
            shot: file,
          });
        }
      }
      finished = !stuck;
      break;
    }
    const step = await playScreen(page, screen, index, labels, cash);
    index = step.index;
    cash = step.cash;
  }

  noteWatch(lesson, viewport, index, bag);
  bag.responses.length = 0;
  bag.consoleErrors.length = 0;
  if (!finished) {
    throw new Error(`Lesson ${lesson} never returned to Academy (${page.url()})`);
  }
}

async function spotLesson(page: Page, lesson: number, viewport: string): Promise<void> {
  const content = lessonContent(lesson);
  const first = content.screens[0];
  const last = content.screens[content.screens.length - 1];
  if (!first || !last) throw new Error(`Lesson ${lesson} has no screens`);
  await page.addInitScript(guestInitScript(lesson));
  await page.goto(`${BASE}/dashboard/academy/lesson/${lesson}?preview=1&screen=0&recording=1`, {
    waitUntil: "domcontentloaded",
  });
  await dismissIntro(page);
  await waitForScreen(page, first, null);
  await shot(page, `spot-first-l${lesson}-${viewport}`);
  const lastIndex = content.screens.length - 1;
  await page.goto(
    `${BASE}/dashboard/academy/lesson/${lesson}?preview=1&screen=${lastIndex}&recording=1`,
    { waitUntil: "domcontentloaded" },
  );
  await dismissIntro(page);
  await waitForScreen(page, last, null);
  await shot(page, `spot-last-l${lesson}-${viewport}`);
}

async function playDirect(page: Page, lesson: number, viewport: string): Promise<void> {
  const bag = watchPage(page);
  try {
    await page.addInitScript(guestInitScript(lesson));
    await openLessonDirect(page, lesson);
    await walkLoadedLesson(page, lesson, viewport, bag);
  } finally {
    bag.stop();
  }
}

async function playChain(page: Page, lessons: number[], viewport: string): Promise<void> {
  const first = lessons[0];
  if (first == null) return;
  const bag = watchPage(page);
  try {
    await page.addInitScript(guestInitScript(first));
    await openLessonDirect(page, first);
    for (let cursor = 0; cursor < lessons.length; cursor += 1) {
      const lesson = lessons[cursor];
      if (lesson == null) continue;
      console.log(`play L${lesson}`);
      try {
        if (cursor > 0) await openLessonFromMap(page, lesson);
        await walkLoadedLesson(page, lesson, viewport, bag);
        passed.push(lesson);
        console.log(`done L${lesson}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`FAIL L${lesson}: ${message}`);
        failedLessons.push({ lesson, viewport, error: message });
        const file = await shot(page, `bug-play-failed-l${lesson}-${viewport}`).catch(() => "");
        addBug({
          id: `play-failed-${lesson}-${viewport}`,
          severity: "blocker",
          lesson,
          screen: -1,
          words: "",
          title: "Playthrough stopped before the lesson finished",
          detail: message,
          shot: file || undefined,
        });
        break;
      }
    }
  } finally {
    bag.stop();
  }
}

async function runDirect(
  name: string,
  browser: Browser,
  viewport: { width: number; height: number },
  lessons: number[],
): Promise<void> {
  console.log(`\n== ${name} ${viewport.width}x${viewport.height} ==`);
  for (const lesson of lessons) {
    const context = await browser.newContext({
      viewport,
      hasTouch: viewport.width < 500,
      isMobile: viewport.width < 500,
    });
    const page = await context.newPage();
    console.log(`play L${lesson}`);
    try {
      await playDirect(page, lesson, name);
      passed.push(lesson);
      console.log(`done L${lesson}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`FAIL L${lesson}: ${message}`);
      failedLessons.push({ lesson, viewport: name, error: message });
      const file = await shot(page, `bug-play-failed-l${lesson}-${name}`).catch(() => "");
      addBug({
        id: `play-failed-${lesson}-${name}`,
        severity: "blocker",
        lesson,
        screen: -1,
        words: "",
        title: "Playthrough stopped before the lesson finished",
        detail: message,
        shot: file || undefined,
      });
    }
    await context.close();
  }
}

async function runChain(
  name: string,
  browser: Browser,
  viewport: { width: number; height: number },
  lessons: number[],
): Promise<void> {
  console.log(`\n== chain ${name} ${viewport.width}x${viewport.height} ==`);
  const context = await browser.newContext({
    viewport,
    hasTouch: viewport.width < 500,
    isMobile: viewport.width < 500,
  });
  const page = await context.newPage();
  try {
    await playChain(page, lessons, name);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`FAIL chain: ${message}`);
    failedLessons.push({ lesson: lessons[0] ?? 0, viewport: name, error: message });
    await shot(page, `bug-chain-${name}`).catch(() => "");
  }
  await context.close();
}

async function runSpots(
  name: string,
  browser: Browser,
  viewport: { width: number; height: number },
  lessons: number[],
): Promise<void> {
  if (lessons.length === 0) return;
  console.log(`\n== spot ${name} ==`);
  for (const lesson of lessons) {
    const context = await browser.newContext({
      viewport,
      hasTouch: viewport.width < 500,
      isMobile: viewport.width < 500,
    });
    const page = await context.newPage();
    console.log(`spot L${lesson}`);
    try {
      await spotLesson(page, lesson, name);
      console.log(`spot done L${lesson}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`FAIL spot L${lesson}: ${message}`);
      failedLessons.push({ lesson, viewport: name, error: message });
      await shot(page, `bug-spot-l${lesson}-${name}`).catch(() => "");
    }
    await context.close();
  }
}

async function main(): Promise<void> {
  const args = parseUatArgs(process.argv.slice(2), {
    LESSONS: process.env.LESSONS,
    SKIP_WEBKIT: process.env.SKIP_WEBKIT,
  });
  shotPending = args.shot;
  mkdirSync("/opt/cursor/artifacts", { recursive: true });
  console.log(
    `walker lessons=${args.lessons.join(",")} spot=${args.spot.join(",") || "-"} viewport=${args.viewports.join("+")} chain=${args.chain} shot=${args.shot}`,
  );
  const chrome = await chromium.launch();
  for (const name of args.viewports) {
    const size = VIEWPORTS[name];
    if (args.chain) await runChain(name, chrome, size, args.lessons);
    else await runDirect(name, chrome, size, args.lessons);
    await runSpots(name, chrome, size, args.spot);
  }
  await chrome.close();
  if (args.webkit) {
    const webkitBrowser = await webkit.launch();
    for (const name of args.viewports) {
      const size = VIEWPORTS[name];
      if (args.chain) await runChain(`webkit-${name}`, webkitBrowser, size, args.lessons);
      else await runDirect(`webkit-${name}`, webkitBrowser, size, args.lessons);
    }
    await webkitBrowser.close();
  }
  const report = { bugs, passed, failedLessons };
  writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
  const serious = bugs.filter((bug) => bug.severity === "blocker" || bug.severity === "major");
  console.log(JSON.stringify({ bugCount: bugs.length, serious: serious.length, passed, failedLessons }, null, 2));
  if (failedLessons.length > 0 || serious.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
