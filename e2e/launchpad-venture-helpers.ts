/**
 * Shared helpers for the Launchpad venture test-route specs
 * (e2e/launchpad-venture-*.spec.ts). Each screen gets a numbered screenshot
 * plus the same checks: no console errors, no "NGA"/"XP" in visible text,
 * white page background, the primary button visible and clear of the tab
 * bar, and no horizontal overflow. Screen checks are soft, so one bad screen
 * does not hide the rest of the journey.
 *
 * Screenshots go to LP_E2E_SHOTS_DIR when set (else the test output dir);
 * one JSON line per checked screen goes to LP_E2E_LOG when set.
 */
import fs from "node:fs";
import path from "node:path";
import { expect, type Locator, type Page, type TestInfo, test } from "@playwright/test";

export const ROUTE = "/test-launchpad-venture";
export const MOBILE = { width: 390, height: 844 };
export const DESKTOP = { width: 1280, height: 900 };

export type ScreenProblem = string;

type Tracker = {
  group: string;
  count: number;
  errors: string[];
  page: Page;
  info: TestInfo;
};

/** Starts tracking console errors for a page and returns the step tracker. */
export function track(page: Page, info: TestInfo, group: string): Tracker {
  const t: Tracker = { group, count: 0, errors: [], page, info };
  page.on("console", (msg) => {
    if (msg.type() === "error") t.errors.push(msg.text().slice(0, 300));
  });
  page.on("pageerror", (err) => t.errors.push(`pageerror: ${err.message.slice(0, 300)}`));
  return t;
}

function shotsDir(info: TestInfo): string {
  const dir = process.env.LP_E2E_SHOTS_DIR || info.outputPath("shots");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function log(record: Record<string, unknown>) {
  const file = process.env.LP_E2E_LOG;
  if (file) fs.appendFileSync(file, `${JSON.stringify(record)}\n`);
}

const WHITE = "rgb(255, 255, 255)";

/** Visible-page checks shared by every screen. Returns the problems found. */
export async function screenProblems(page: Page, primary?: Locator | null): Promise<ScreenProblem[]> {
  const problems: ScreenProblem[] = [];
  const facts = await page.evaluate(() => {
    const text = document.body.innerText;
    const bg = (el: Element | null) => (el ? getComputedStyle(el).backgroundColor : "");
    const shell = document.querySelector("main")?.parentElement ?? null;
    const vw = document.documentElement.clientWidth;
    const wide: string[] = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || r.right <= vw + 1) continue;
      let clipped = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const ox = getComputedStyle(a).overflowX;
        if (ox !== "visible") {
          clipped = true;
          break;
        }
      }
      if (!clipped) wide.push(`${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""} right=${Math.round(r.right)}`);
      if (wide.length > 3) break;
    }
    return {
      nga: /\bNGA\b/.test(text),
      xp: /\bXP\b/.test(text),
      bodyBg: bg(document.body),
      shellBg: bg(shell),
      mainBg: bg(document.querySelector("main")),
      scrollWidth: document.documentElement.scrollWidth,
      vw,
      wide,
    };
  });
  if (facts.nga) problems.push('visible text contains "NGA"');
  if (facts.xp) problems.push('visible text contains "XP"');
  if (facts.bodyBg !== WHITE && facts.bodyBg !== "rgba(0, 0, 0, 0)") problems.push(`page background is ${facts.bodyBg}`);
  if (facts.shellBg && facts.shellBg !== WHITE && facts.shellBg !== "rgba(0, 0, 0, 0)")
    problems.push(`app shell background is ${facts.shellBg}`);
  if (facts.mainBg && facts.mainBg !== WHITE && facts.mainBg !== "rgba(0, 0, 0, 0)")
    problems.push(`main area background is ${facts.mainBg}`);
  if (facts.scrollWidth > facts.vw + 1) problems.push(`horizontal overflow: page is ${facts.scrollWidth}px wide in a ${facts.vw}px window`);
  if (facts.wide.length) problems.push(`elements stick out past the right edge: ${facts.wide.join(", ")}`);

  if (primary) {
    if ((await primary.count()) === 0 || !(await primary.first().isVisible())) {
      problems.push("primary button not visible");
    } else {
      const btn = primary.first();
      await btn.scrollIntoViewIfNeeded();
      // Scroll the way a learner would: far enough that the button clears the
      // fixed tab bar, if the page can scroll that far.
      const before = await btn.boundingBox();
      const navTop = await page.evaluate(() => document.querySelector('nav[aria-label="Main navigation"]')?.getBoundingClientRect().top ?? innerHeight);
      if (before && before.y + before.height > navTop) {
        await page.evaluate((dy) => window.scrollTo({ top: window.scrollY + dy, behavior: "instant" }), before.y + before.height - navTop + 8);
        await page.waitForTimeout(150);
      }
      const box = await btn.boundingBox();
      const nav = page.locator('nav[aria-label="Main navigation"]');
      const navBox = (await nav.count()) && (await nav.first().isVisible()) ? await nav.first().boundingBox() : null;
      const vh = page.viewportSize()?.height ?? 0;
      if (!box) problems.push("primary button has no box");
      else {
        if (navBox && box.y + box.height > navBox.y + 0.5) {
          const sc = await page.evaluate(() => ({
            y: Math.round(scrollY),
            max: document.documentElement.scrollHeight - innerHeight,
          }));
          problems.push(
            `primary button bottom (${Math.round(box.y + box.height)}px) is under the tab bar top (${Math.round(navBox.y)}px) even when scrolled to ${sc.y}px of ${sc.max}px`,
          );
        }
        if (box.y + box.height > vh + 0.5) problems.push("primary button runs off the bottom of the screen");
      }
    }
  }
  return problems;
}

/**
 * Screenshot with a temporary "TEST INPUT" label at the top so nobody mistakes
 * the typed answers (all prefixed "TEST ") for real content. The label is added
 * after the screen checks and removed straight after the screenshot.
 */
async function labelledScreenshot(page: Page, file: string) {
  await page
    .evaluate(() => {
      const el = document.createElement("div");
      el.id = "__lp_e2e_test_label";
      el.textContent = "E2E TEST - typed answers are TEST inputs, not content";
      el.setAttribute(
        "style",
        "position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#d00;color:#fff;font:bold 11px/16px sans-serif;text-align:center;pointer-events:none",
      );
      document.body.appendChild(el);
    })
    .catch(() => {});
  await page.screenshot({ path: file }).catch(() => {});
  await page.evaluate(() => document.getElementById("__lp_e2e_test_label")?.remove()).catch(() => {});
}

/**
 * One checked step: screenshot, screen checks (soft), console errors since
 * the last step (soft). `primary` is the screen's main button, if any.
 */
export async function shot(t: Tracker, name: string, primary?: Locator | null, notes?: string) {
  t.count += 1;
  const n = String(t.count).padStart(2, "0");
  const file = path.join(shotsDir(t.info), `${t.group}-${n}-${slug(name)}.png`);
  const problems = await screenProblems(t.page, primary);
  // Screenshot after the primary button is scrolled into view (as a learner would see it).
  await labelledScreenshot(t.page, file);
  const errors = t.errors.splice(0);
  if (errors.length) problems.push(`console errors: ${errors.join(" | ")}`);
  log({ group: t.group, n: t.count, step: name, shot: file, ok: problems.length === 0, problems, notes, viewport: t.page.viewportSize() });
  // The small-phone run ("s") gates on AC2 fit only; its other screen checks
  // are logged, and they gate at 390 and on desktop.
  if (t.group !== "s") expect.soft(problems, `${t.group} #${n} ${name}`).toEqual([]);
}

/** A functional step: runs `fn`; on failure logs it with a screenshot, then rethrows. */
export async function step<T>(t: Tracker, name: string, fn: () => Promise<T>): Promise<T> {
  return test.step(name, async () => {
    try {
      return await fn();
    } catch (err) {
      t.count += 1;
      const n = String(t.count).padStart(2, "0");
      const file = path.join(shotsDir(t.info), `${t.group}-${n}-FAILED-${slug(name)}.png`);
      await labelledScreenshot(t.page, file);
      const msg = err instanceof Error ? err.message.split("\n").slice(0, 6).join(" ") : String(err);
      log({ group: t.group, n: t.count, step: name, shot: file, ok: false, problems: [`step failed: ${msg}`], functional: true });
      throw err;
    }
  });
}

/** Records a functional check that passed (for the report table). */
export function passed(t: Tracker, name: string, notes?: string) {
  log({ group: t.group, n: t.count, step: name, ok: true, problems: [], functional: true, notes });
}

export const nextButton = (page: Page) => page.locator("main button").filter({ hasText: /^(Next ›|Finish ›|Continue|Save to my workbook|Add this goal)$/ });

export async function waitIdle(page: Page) {
  await page.waitForLoadState("networkidle").catch(() => {});
}

export async function openFresh(page: Page, query = "") {
  await page.goto(`${ROUTE}?reset=1${query ? `&${query}` : ""}`);
  await expect(page.getByRole("heading", { name: "In Progress" }).or(page.locator("main h1, main h2").first())).toBeVisible({
    timeout: 60_000,
  });
}

/** Builds a shortcut URL (no reset unless asked). */
export const url = (q: string) => `${ROUTE}${q ? `?${q}` : ""}`;

/**
 * AC2: the screen fits without vertical scroll (neither the page nor the
 * workbook body) and the primary button sits in view, above the tab bar when
 * one shows. Soft, logged per screen.
 */
export async function fits(t: Tracker, name: string, primary?: Locator | null) {
  const facts = await t.page.evaluate(() => {
    const body = document.querySelector<HTMLElement>("[data-workbook-body]");
    const tabs = document.querySelector('nav[aria-label="Main navigation"]');
    return {
      scrollHeight: document.scrollingElement!.scrollHeight,
      viewport: window.innerHeight,
      limit: tabs ? Math.round(tabs.getBoundingClientRect().top) : window.innerHeight,
      bodyOverflow: body ? body.scrollHeight - body.clientHeight : 0,
    };
  });
  let bottom: number | null = null;
  if (primary && (await primary.count())) {
    const box = await primary.first().boundingBox();
    bottom = box ? Math.round(box.y + box.height) : null;
  }
  const problems: string[] = [];
  if (facts.scrollHeight > facts.viewport + 1) problems.push(`scrolls vertically: ${facts.scrollHeight}px in a ${facts.viewport}px window`);
  if (facts.bodyOverflow > 1) problems.push(`workbook body scrolls by ${facts.bodyOverflow}px`);
  if (primary && (bottom === null || bottom > facts.limit)) problems.push(`primary button bottom ${bottom}px is below ${facts.limit}px (window or tab bar)`);
  log({ group: t.group, n: t.count, step: `fit: ${name}`, ok: problems.length === 0, problems, functional: true, notes: JSON.stringify({ ...facts, bottom }), viewport: t.page.viewportSize() });
  expect.soft(problems, `${t.group} fit ${name}`).toEqual([]);
}
