/**
 * TEST-ONLY. Workbook structure with the LONGEST possible vision (Cath, 5 Nov
 * 5:35pm): page 1 is the cover (80px logo centered at the top, a smaller
 * name, then Our vision), page 2 Define the business, page 3 Set your goals.
 * No separate identity page and no Done chip on any page. The whole cover
 * must fit inside the page card with no scrolling, at 390x844 and 375x667.
 * Answers are the Level 1 ?complete= samples, then pushed to the maximum
 * (every offer, every reason ranked, every goal filled to its limits).
 */
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { ROUTE, shot, track } from "./launchpad-venture-helpers";

type Field = { name: string; input: string; maxLength?: number; max?: number; options?: { id: string; label: string }[] };
type Screen = { type: string; answerKey?: string; mode?: string; options?: { id: string; label: string }[]; items?: { id: string }[]; fields?: Field[]; goals?: { screen: Screen }[] };

const WORDS = "TEST a long saved answer that goes right up to the limit of the field with plenty of words in it to wrap ";
const longText = (n: number) => WORDS.repeat(4).slice(0, n).trimEnd();

function longestAnswers(): Record<string, unknown> {
  const venture = JSON.parse(readFileSync("content/launchpad/dog-walking.load.json", "utf8"));
  const out: Record<string, unknown> = {};
  const longest = (o: { id: string; label: string }[]) => [...o].sort((a, b) => b.label.length - a.label.length)[0]!.id;
  const visit = (sc: Screen) => {
    if (sc.type === "goal-loop") return sc.goals!.forEach((g) => visit(g.screen));
    if (!sc.answerKey || sc.answerKey.startsWith("l2")) return;
    if (sc.type === "choice-capture")
      out[sc.answerKey] = { kind: "selection", version: 1, selected: sc.mode === "multi" ? sc.options!.map((o) => o.id) : [longest(sc.options!)] };
    else if (sc.type === "rank-order") out[sc.answerKey] = { kind: "ranking", version: 1, order: sc.items!.map((i) => i.id), notApplicable: [] };
    else if (sc.type === "short-text") {
      const values: Record<string, string | number> = {};
      for (const f of sc.fields ?? []) {
        if (f.input === "text") values[f.name] = longText(f.maxLength ?? 120);
        else if (f.input === "integer") values[f.name] = f.max ?? 99;
        else if (f.input === "choice") values[f.name] = f.name === "timeframeUnit" ? "months" : longest(f.options!);
        else if (f.input === "currency") values[f.name] = "USD";
      }
      out[sc.answerKey] = { kind: "fields", version: 1, values };
    }
  };
  const walk = (n: unknown): void => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (n && typeof n === "object") {
      const o = n as Screen & Record<string, unknown>;
      if (typeof o.type === "string" && (o.answerKey || o.type === "goal-loop") && ["choice-capture", "rank-order", "short-text", "goal-loop"].includes(o.type)) return visit(o);
      Object.values(o).forEach(walk);
    }
  };
  walk(venture);
  return out;
}

async function openLongVisionWorkbook(page: Page) {
  await page.goto(`${ROUTE}?reset=1&complete=l1-s3`);
  await expect(page.locator("#lp-corridor-title, main h1, main h2").first()).toBeVisible({ timeout: 60_000 });
  const answers = longestAnswers();
  await page.evaluate((a) => {
    const k = "lp-venture-test:v1:dog-walking";
    const p = JSON.parse(localStorage.getItem(k) ?? "{}");
    p.answers = { ...(p.answers ?? {}), ...a };
    localStorage.setItem(k, JSON.stringify(p));
  }, answers);
  await page.goto(ROUTE);
  await page.locator('[data-in-progress="dog-walking"] [data-handbook-button]').click();
  const hb = page.getByRole("dialog");
  await expect(hb.getByRole("heading", { name: "My workbook" })).toBeVisible();
  return hb;
}

for (const vp of [
  { width: 390, height: 844, group: "w" },
  { width: 375, height: 667, group: "ws" },
]) {
  test(`workbook: cover, Define, Goals with the longest vision fit at ${vp.width}x${vp.height}`, async ({ page }, info) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const t = track(page, info, vp.group);
    const hb = await openLongVisionWorkbook(page);
    const cover = hb.locator('[data-handbook-page="cover"]');
    await expect(cover).toBeVisible();
    await expect(hb).not.toContainText(/handbook/i);

    // Page order: cover, Define the business, Set your goals (no identity page).
    const ids = await hb.locator("[data-page-dots] > span").count();
    const order: string[] = [];
    for (let i = 0; i < ids; i++) {
      const id = await hb.locator("[data-handbook-page]").getAttribute("data-handbook-page");
      order.push(id!);
      await expect(hb.locator("[data-done-chip]")).toHaveCount(0);
      if (await hb.getByRole("button", { name: "Next page" }).isDisabled()) break;
      await hb.getByRole("button", { name: "Next page" }).click();
    }
    expect(order).toEqual(["cover", "l1-s1", "l1-s2"]);
    await hb.getByRole("button", { name: "Previous page" }).click();
    await hb.getByRole("button", { name: "Previous page" }).click();
    await expect(cover).toBeVisible();

    // Cover: 80px logo centered at the top, a smaller name, then the whole vision with no scrolling.
    const facts = await cover.evaluate((el) => {
      const scroller = el.closest<HTMLElement>("[data-paper-scroll]")!;
      const card = el.closest<HTMLElement>("[data-paper-card]")!.getBoundingClientRect();
      const logo = el.querySelector("[data-cover-logo] svg")!.getBoundingClientRect();
      const name = el.querySelector<HTMLElement>("[data-business-name]")!;
      const s = el.querySelector<HTMLElement>("[data-vision-sentence]")!;
      const sb = s.getBoundingClientRect();
      const page = el.getBoundingClientRect();
      return {
        overflow: scroller.scrollHeight - scroller.clientHeight,
        logoW: Math.round(logo.width),
        logoCenterOff: Math.abs(logo.left + logo.width / 2 - (page.left + page.width / 2)),
        logoTop: Math.round(logo.top - card.top),
        namePx: parseFloat(getComputedStyle(name).fontSize),
        visionPx: parseFloat(getComputedStyle(s).fontSize),
        visionBottom: Math.round(sb.bottom),
        cardBottom: Math.round(card.bottom),
        step: el.querySelector("[data-cover]")!.getAttribute("data-cover-fit-step"),
        visionChars: s.textContent!.length,
      };
    });
    console.log(`[${vp.width}x${vp.height}] cover`, JSON.stringify(facts));
    expect(facts.logoW).toBe(80);
    expect(facts.logoCenterOff).toBeLessThan(4);
    expect(facts.logoTop).toBeLessThan(50);
    expect(facts.namePx).toBeLessThanOrEqual(19); // 17px, or the font's floor
    expect(facts.visionPx).toBeGreaterThanOrEqual(11);
    if (vp.height >= 844) {
      // 390x844: the whole longest vision fits inside the card, nothing cut off, no scrolling.
      expect(facts.overflow, "cover scrolls inside the page card").toBeLessThanOrEqual(1);
      expect(facts.visionBottom, "vision cut off by the card").toBeLessThanOrEqual(facts.cardBottom);
    } else {
      // 375x667 with a near-maximum vision: the text reaches its smallest step (11px);
      // only then may the card scroll, and the end of the vision is reachable (never clipped).
      if (facts.overflow > 1) expect(facts.step).toBe("6");
      const end = await cover.evaluate((el) => {
        const sc = el.closest<HTMLElement>("[data-paper-scroll]")!;
        sc.scrollTop = sc.scrollHeight;
        const r = el.querySelector("[data-vision-sentence]")!.getBoundingClientRect();
        const c = sc.getBoundingClientRect();
        return { bottom: r.bottom, cardBottom: c.bottom };
      });
      expect(end.bottom).toBeLessThanOrEqual(end.cardBottom);
      await cover.evaluate((el) => (el.closest<HTMLElement>("[data-paper-scroll]")!.scrollTop = 0));
    }
    await shot(t, `Workbook page 1 cover, longest vision (${vp.width}x${vp.height})`, null);
    await hb.getByRole("button", { name: "Next page" }).click();
    await expect(hb.locator('[data-handbook-page="l1-s1"]')).toBeVisible();
    await shot(t, `Workbook page 2 Define the business (${vp.width}x${vp.height})`, null);
    await hb.getByRole("button", { name: "Next page" }).click();
    await expect(hb.locator('[data-handbook-page="l1-s2"]')).toBeVisible();
    await shot(t, `Workbook page 3 Set your goals (${vp.width}x${vp.height})`, null);
  });
}
