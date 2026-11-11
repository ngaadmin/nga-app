/**
 * The Launchpad handbook: the learner's business workbook.
 *
 * One page per COMPLETED silver, in building order (pages exist only for
 * completed silvers). The next silver shows as a faint ghost peeking behind
 * the last page. Everything here is derived from progress and the venture
 * content, so the handbook always reads the same saved answers the lessons
 * write (single source of truth).
 */
import type { LaunchpadFloor, LaunchpadSilver, LaunchpadSummarySection, LaunchpadTextField } from "@/lib/launchpad/content/types";
import { applyFieldChange } from "@/lib/launchpad/content/fields";
import { kebabId } from "@/lib/launchpad/venture-test/handbook-ids";
import { costsOf, fieldsAnswer, identityAnswerOf, jobsOf, priceOf, rankingAnswer, salesChannelsOf, selectionAnswer, selectionOf, type JobsAnswer, type LaunchpadAnswer, type PriceAnswer } from "@/lib/launchpad/content/answers";
import { keptPerJob, weeklyKeep, weeksFromWeeklyKeep } from "@/lib/launchpad/content/pricing/calc";
import { workbookView } from "@/lib/launchpad/content/know-your-cost/logic";
import { AGREE_JOB_KEY, DELIVER_JOB_KEY, FIND_CUSTOMERS_KEY, POLISH_SERVICE_KEY, PRACTICE_RUN_KEY, WRAP_JOB_KEY } from "@/lib/launchpad/content/getting-ready/copy";
import { FUNDING_ANSWER_KEY } from "@/lib/launchpad/content/planning/funding";
import { salesWorkbookSheets } from "@/lib/launchpad/content/sales/workbook-sheets";
import { SALES_CHANNELS_KEY } from "@/lib/launchpad/content/sales/copy";
import { IDENTITY_ANSWER_KEY } from "@/lib/launchpad/content/seed/identity-silver";
import { JOBS_COVER_ANSWER_KEY, SET_PRICE_ANSWER_KEY } from "@/lib/launchpad/content/pricing/screens";
import { findKnowYourCost, sampleCostsAnswer } from "@/lib/launchpad/content/know-your-cost/logic";
import type { CaptureScreen } from "@/lib/launchpad/content/task-pages";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import { clampBusinessName, IDENTITY_ANSWER_VERSION, type BusinessIdentityAnswer } from "@/lib/launchpad/content/identity";
import { identityChoices } from "@/lib/launchpad/content/identity-content";
import {
  currentLevel,
  floorState,
  isBronzeDone,
  isFloorDone,
  isSilverDone,
  isTaskDone,
  setProgressAnswer,
  ventureTestFloorUnlocked,
  type VentureTestProgress,
} from "@/lib/launchpad/venture-test/venture-test-progress";

/** Where the handbook was opened from. Home is read-only; the building edits completed pages. */
export type HandbookEntry = "home" | "building";

export type HandbookPageView = {
  /** 1-based page number. */
  number: number;
  level: number;
  floorName: string;
  /** 1-based position of the silver on its floor. */
  silverNumber: number;
  silver: LaunchpadSilver;
  /**
   * "cover": page 1, the saved identity answer (logo and name) and the vision;
   * "summary": a silver's sections from saved answers; "placeholder": any
   * other silver. The identity silver has no page of its own (Cath, 5 Nov
   * 5:35pm: the vision shows once, on the cover); its answer feeds the cover.
   */
  kind: "cover" | "summary" | "placeholder" | "costs";
  /** Extra sheet when one silver fills more than one workbook page. */
  sheet?: string;
  /** Titles of the silver's finished bronzes (written out under plain headings on placeholder pages). */
  bronzeTitles: string[];
  /** False only for a floor preview opened before that level has a workbook page. */
  done: boolean;
};

export type HandbookGhostView = { level: number; floorName: string; silverTitle: string };

/** Navy = earned (floor done), cyan = current floor, dashed = unearned (not tappable). */
export type HandbookTabState = "earned" | "current" | "unearned";

export type HandbookTab = { level: number; name: string; state: HandbookTabState; tappable: boolean };

function orderedSilvers(floors: readonly LaunchpadFloor[]) {
  return floors.flatMap((f) => f.silvers.map((silver, i) => ({ floor: f, silver, silverNumber: i + 1 })));
}

/**
 * Page 1 is the cover (logo, name, vision; workbook-page1-cover-spec-r1) once
 * any silver is done, when the venture has an identity silver with a vision.
 * Then one page per completed silver, in building order, except the identity
 * silver itself: it has no separate page (its answer is on the cover).
 */
/** My costs, once that task is saved. Replaces Pricing's placeholder page when the plaque is already done. */
function withCostsPage(progress: VentureTestProgress, floors: readonly LaunchpadFloor[], pages: HandbookPageView[]): HandbookPageView[] {
  const found = findKnowYourCost(floors);
  if (!hasHandbook(progress, floors) || !found || !isTaskDone(progress, found.task.id)) return pages;
  const answer = costsOf(progress.answers, found.screen.answerKey);
  if (!answer) return pages;
  const view: HandbookPageView = {
    number: 0,
    level: found.floor.level,
    floorName: found.floor.name,
    silverNumber: found.silverNumber,
    silver: found.silver,
    kind: "costs",
    bronzeTitles: [],
    done: true,
  };
  const existing = pages.findIndex((page) => page.silver.id === found.silver.id);
  const next = existing >= 0 ? pages.map((page, i) => (i === existing ? { ...view, number: page.number } : page)) : [...pages, view];
  return next.map((page, i) => ({ ...page, number: i + 1 }));
}

export function handbookPages(progress: VentureTestProgress, floors: readonly LaunchpadFloor[]): HandbookPageView[] {
  const pages = withCostsPage(progress, floors, silverPages(progress, floors));
  const id = orderedSilvers(floors).find(({ silver }) => silver.wrapUp?.type === "identity-wrap-up" && silver.wrapUp.vision);
  if (!hasHandbook(progress, floors) || !id) return expandSheets(progress, pages);
  const cover: HandbookPageView = {
    number: 1,
    level: floors[0]!.level,
    floorName: floors[0]!.name,
    silverNumber: 0,
    silver: id.silver,
    kind: "cover",
    bronzeTitles: [],
    done: true,
  };
  return expandSheets(progress, [cover, ...pages.map((p) => ({ ...p, number: p.number + 1 }))]);
}

/** Split the busier workbook pages. Costs become 3 and 3b. Getting Ready becomes three pages. */
function expandSheets(progress: VentureTestProgress, pages: HandbookPageView[], templates = false): HandbookPageView[] {
  const out: HandbookPageView[] = [];
  for (const page of pages) {
    if (page.silver.id === "l3-s1") continue;
    if (page.done && page.kind === "placeholder") {
      const entries = levelUpWorkbookPages(page.silver);
      if (entries.length) {
        for (const item of entries) out.push({ ...page, kind: "summary", sheet: item.id });
        continue;
      }
    }
    if (page.kind === "costs") {
      out.push({ ...page, kind: "summary", sheet: "pricing-b" });
      out.push({ ...page, sheet: "costs-a" });
      out.push({ ...page, sheet: "costs-b" });
      if (templates || priceOf(progress.answers, SET_PRICE_ANSWER_KEY)) out.push({ ...page, kind: "summary", sheet: "price" });
      if (templates || jobsOf(progress.answers, JOBS_COVER_ANSWER_KEY)) {
        out.push({ ...page, kind: "summary", sheet: "jobs" });
        out.push({ ...page, kind: "summary", sheet: "plan-1" });
        out.push({ ...page, kind: "summary", sheet: "plan-2" });
        out.push({ ...page, kind: "summary", sheet: "plan-3" });
        out.push({ ...page, kind: "summary", sheet: "plan-4" });
      }
    } else if (page.silver.id === "l2-s3") {
      out.push({ ...page, sheet: "funding" });
    } else if (page.silver.id === "l6-s1") {
      out.push({ ...page, kind: "summary", sheet: "budget-split" });
    } else if (page.silver.id === "l4-s2") {
      out.push({ ...page, kind: "summary", sheet: "order-system" });
    } else if (page.silver.id === "l4-s1") {
      const name = identityAnswerOf(progress.answers, IDENTITY_ANSWER_KEY)?.name || "My business";
      const sheets = salesWorkbookSheets(progress.answers, name);
      if (sheets.length === 0 || (!templates && !salesChannelsOf(progress.answers, SALES_CHANNELS_KEY))) out.push(page);
      else for (const sheet of sheets) out.push({ ...page, kind: "summary", sheet: sheet.id });
    } else if (page.silver.id === "l3-s3") {
      out.push({ ...page, sheet: "ready-a" });
      out.push({ ...page, sheet: "ready-b" });
      out.push({ ...page, sheet: "ready-c" });
    } else out.push(page);
  }
  return out.map((page, i) => ({ ...page, number: i + 1 }));
}

/** Ordered workbook pages declared on a Level Up silver. Empty when that payload has none yet. */
function levelUpWorkbookPages(silver: LaunchpadSilver): readonly { id: string; title: string }[] {
  for (const bronze of silver.bronzes)
    for (const task of bronze.tasks)
      for (const screen of task.screens)
        if (screen.type === "level-up") return screen.content.workbookPages ?? [];
  return [];
}

function silverPages(progress: VentureTestProgress, floors: readonly LaunchpadFloor[]): HandbookPageView[] {
  return orderedSilvers(floors)
    .filter(({ silver }) => isSilverDone(progress, silver) && silver.wrapUp?.type !== "identity-wrap-up")
    .map(({ floor, silver, silverNumber }, i) => ({
      number: i + 1,
      level: floor.level,
      floorName: floor.name,
      silverNumber,
      silver,
      kind: silver.wrapUp?.type === "workbook-summary" || silverHandbookSections(silver).length ? "summary" : "placeholder",
      bronzeTitles: silver.bronzes.filter((b) => isBronzeDone(progress, b)).map((b) => b.title),
      done: true,
    }));
}

/**
 * The handbook sections a silver's own answers fill (Final column Z, e.g.
 * "What my business will offer", "My why", "My cause", "My goals"), in
 * building order. A workbook-summary wrap-up's sections win when it has them.
 * Multi picks show as chips, a ranking as a numbered list, a single pick as
 * text, and a goal loop as one sentence per filled goal.
 */
/**
 * The goal fields the sheet's column AA lets the learner retype inline on the
 * handbook page (AA6 to AA8). Amount, currency and timeframes stay read-only.
 */
export const GOAL_INLINE_EDITS: Readonly<Record<string, readonly string[]>> = {
  "l1-goal-make-money": ["savingFor"], // AA6
  "l1-goal-help-others": ["customerCount", "benefit"], // AA7
  "l1-goal-learn-new-skills": ["skill", "achievement"], // AA8
};

export function silverHandbookSections(silver: LaunchpadSilver): LaunchpadSummarySection[] {
  if (silver.wrapUp?.type === "workbook-summary") return [...silver.wrapUp.sections];
  const out: LaunchpadSummarySection[] = [];
  const add = (label: string, display: LaunchpadSummarySection["display"], answerKeys: readonly string[]) => {
    const prev = out.find((x) => x.label === label);
    const sources = answerKeys.map((answerKey) =>
      GOAL_INLINE_EDITS[answerKey] ? { answerKey, editFields: GOAL_INLINE_EDITS[answerKey] } : { answerKey },
    );
    if (prev) out[out.indexOf(prev)] = { ...prev, sources: [...prev.sources, ...sources] };
    else out.push({ id: kebabId(label), label, display, sources });
  };
  for (const b of silver.bronzes)
    for (const t of b.tasks)
      for (const sc of t.screens) {
        if (sc.type === "goal-loop" && sc.handbookLabel) add(sc.handbookLabel, "sentences", sc.goals.map((g) => g.screen.answerKey));
        else if (sc.type === "choice-capture" && sc.handbookLabel) add(sc.handbookLabel, sc.mode === "multi" ? "list" : "choice", [sc.answerKey]);
        else if (sc.type === "rank-order" && sc.handbookLabel) add(sc.handbookLabel, "ranked", [sc.answerKey]);
        else if (sc.type === "short-text" && sc.handbookLabel) add(sc.handbookLabel, "sentences", [sc.answerKey]);
      }
  return out;
}

/** The next silver to earn (the ghost page), or null once every silver is done. */
export function handbookGhost(progress: VentureTestProgress, floors: readonly LaunchpadFloor[]): HandbookGhostView | null {
  const next = orderedSilvers(floors).find(({ silver }) => !isSilverDone(progress, silver));
  return next ? { level: next.floor.level, floorName: next.floor.name, silverTitle: next.silver.title } : null;
}

/**
 * The workbook always opens on page 1 (the cover with the identity) and the
 * right arrow / a left swipe moves forward through the pages in order (Cath,
 * 5 Nov 5:27pm). It used to open on the latest page.
 */
export function handbookOpenIndex(pages: readonly HandbookPageView[]): number {
  void pages;
  return 0;
}

/** The book button shows only once the business has at least one completed silver (one page). */
export function hasHandbook(progress: VentureTestProgress, floors: readonly LaunchpadFloor[]): boolean {
  return orderedSilvers(floors).some(({ silver }) => isSilverDone(progress, silver));
}

/** Accessible name of the illustrated workbook icon on a floor and on Launchpad home. */
export const WORKBOOK_FLOOR_LABEL = "Open your workbook";

/** Back control when the home card opens a level-scoped workbook. */
export const WORKBOOK_HOME_BACK_LABEL = "‹ Back to Launchpad";

/**
 * Workbook pages for one level only, including pages whose answers are still empty.
 * Used by the Launchpad home card. The floor shortcut does not use this.
 */
export function handbookScopePages(
  progress: VentureTestProgress,
  floors: readonly LaunchpadFloor[],
  level: number,
): HandbookPageView[] {
  const floor = floors.find((item) => item.level === level);
  if (!floor) return [];
  const costSilverId = findKnowYourCost(floors)?.silver.id;
  const views: HandbookPageView[] = [];
  if (level === floors[0]?.level) {
    const identity = orderedSilvers(floors).find(({ silver }) => silver.wrapUp?.type === "identity-wrap-up" && silver.wrapUp.vision);
    if (identity) {
      views.push({
        number: 1,
        level: floor.level,
        floorName: floor.name,
        silverNumber: 0,
        silver: identity.silver,
        kind: "cover",
        bronzeTitles: [],
        done: isSilverDone(progress, identity.silver),
      });
    }
  }
  floor.silvers.forEach((silver, index) => {
    if (silver.wrapUp?.type === "identity-wrap-up") return;
    const sections = silverHandbookSections(silver);
    views.push({
      number: views.length + 1,
      level: floor.level,
      floorName: floor.name,
      silverNumber: index + 1,
      silver,
      kind: silver.id === costSilverId ? "costs" : silver.wrapUp?.type === "workbook-summary" || sections.length ? "summary" : "placeholder",
      bronzeTitles: silver.bronzes.map((bronze) => bronze.title),
      done: isSilverDone(progress, silver),
    });
  });
  return expandSheets(progress, views, true)
    .filter((page) => page.level === level)
    .map((page, index) => ({ ...page, number: index + 1 }));
}

/** A real workbook page, not a locked placeholder floor. */
function floorHasWorkbookPages(progress: VentureTestProgress, floors: readonly LaunchpadFloor[], level: number): boolean {
  return handbookScopePages(progress, floors, level).some((page) => page.kind !== "placeholder");
}

/**
 * Where the home workbook opens. The highest level the learner has reached
 * that has workbook pages. A locked Growing floor is not that level, even
 * when it is the next floor after Budgeting. The test route counts Sales,
 * Delivery, and Budgeting as reached.
 */
export function workbookLandingLevel(progress: VentureTestProgress, floors: readonly LaunchpadFloor[]): number {
  const current = currentLevel(progress, floors);
  const reached = floors.filter((floor) => {
    if (!floorHasWorkbookPages(progress, floors, floor.level)) return false;
    if (isFloorDone(progress, floor) || ventureTestFloorUnlocked(floor.level)) return true;
    return floor.level === current && floorState(progress, floors, floor.level) !== "locked";
  });
  if (!reached.length) return floors[0]?.level ?? 1;
  return Math.max(...reached.map((floor) => floor.level));
}

/**
 * Pages for a floor shortcut. A level that already has a workbook page is unchanged
 * (existing edit rules). A level with none yet gets one read-only placeholder.
 */
export function handbookPagesForLevel(
  progress: VentureTestProgress,
  floors: readonly LaunchpadFloor[],
  level: number,
): HandbookPageView[] {
  const pages = handbookPages(progress, floors);
  // The cover is Level 1's page. A level that already has any page keeps those pages and their edit rules.
  if (pages.some((page) => page.level === level)) return pages;
  const floor = floors.find((item) => item.level === level);
  const silver = floor?.silvers[0];
  if (!floor || !silver) return pages;
  return [
    ...pages,
    {
      number: pages.length + 1,
      level: floor.level,
      floorName: floor.name,
      silverNumber: 1,
      silver,
      kind: silver.id === "l6-s1" ? "summary" : "placeholder",
      sheet: silver.id === "l6-s1" ? "budget-split" : undefined,
      bronzeTitles: [],
      done: false,
    },
  ];
}

/**
 * Can this page be edited inline? Only from the building screen, and only
 * for a completed silver (`done`). From home the handbook is read-only.
 * A floor preview is not done, so it stays read-only. Completed pages stay editable.
 */
export function isHandbookPageEditable(entry: HandbookEntry, silverDone: boolean): boolean {
  return entry === "building" && silverDone;
}

/** Floor thumb index. Earned and current floors can be tapped; unearned ones cannot. */
export function handbookTabs(progress: VentureTestProgress, floors: readonly LaunchpadFloor[]): HandbookTab[] {
  const current = currentLevel(progress, floors);
  return floors.map((f) => {
    const state: HandbookTabState = isFloorDone(progress, f) ? "earned" : f.level === current ? "current" : "unearned";
    return { level: f.level, name: f.name, state, tappable: state !== "unearned" };
  });
}

/**
 * Page to show when a floor tab is tapped: that floor's first page, or the
 * latest page when the floor has none yet (the current floor before its first
 * silver is done; the ghost of its next silver peeks behind the latest page).
 */
export function handbookTabTarget(pages: readonly HandbookPageView[], level: number): number {
  const i = pages.findIndex((p) => p.level === level && p.kind !== "cover");
  return i === -1 ? Math.max(0, pages.length - 1) : i;
}

/** The business name for the handbook header: the saved identity name, else the fallback (tile name). */
export function handbookBusinessName(progress: VentureTestProgress, floors: readonly LaunchpadFloor[], fallback: string): string {
  for (const { silver } of orderedSilvers(floors)) {
    const key = silver.wrapUp?.type === "identity-wrap-up" ? silver.wrapUp.answerKey : undefined;
    const name = key ? identityAnswerOf(progress.answers, key)?.name?.trim() : undefined;
    if (name) return name;
  }
  return fallback;
}

/**
 * TEST-ONLY. A `?complete=` shortcut marks silvers done without the learner
 * ever answering anything. So the wrap-ups and handbook pages have something
 * real to show, fill sample answers for completed silvers that have none:
 * - identity: the first shape and icon, the second color (light blue, as in
 *   the r4 handbook mock), the first font, the logo color for the name and the
 *   business title as the name;
 * - capture screens (choices, ranking, short text, every goal page): see
 *   shortcutSampleAnswer.
 * Existing answers are never overwritten.
 */
export function withShortcutSampleAnswers(
  progress: VentureTestProgress,
  floors: readonly LaunchpadFloor[],
  iconVentureId: string,
  businessName: string,
): VentureTestProgress {
  let next = progress;
  for (const { silver } of orderedSilvers(floors)) {
    if (!isSilverDone(progress, silver)) continue;
    for (const b of silver.bronzes)
      for (const t of b.tasks)
        // Every goal page, whatever the (sample) ranking leaves out, so later edits have values.
        for (const screen of captureScreensOf(t.screens)) {
          if (next.answers?.[screen.answerKey]) continue;
          const sample = shortcutSampleAnswer(screen);
          if (sample) next = setProgressAnswer(next, screen.answerKey, sample);
        }
      for (const b of silver.bronzes)
        for (const t of b.tasks)
          for (const screen of t.screens) {
            if (screen.type === "sales" && screen.step === "order" && screen.order && !next.answers?.[screen.answerKey]) {
              const tracker = screen.order.trackerOptions[0]?.id;
              const reminder = screen.order.reminderDefault;
              if (tracker && reminder) {
                next = setProgressAnswer(next, screen.answerKey, { kind: "order-system", version: 1, tracker, reminder });
              }
            }
            if (screen.type !== "know-your-cost" || next.answers?.[screen.answerKey]) continue;
            next = setProgressAnswer(next, screen.answerKey, sampleCostsAnswer(screen, floors, next.answers));
          }
  }
  for (const { silver } of orderedSilvers(floors)) {
    if (silver.wrapUp?.type !== "identity-wrap-up" || !isSilverDone(progress, silver)) continue;
    const key = silver.wrapUp.answerKey;
    const saved = identityAnswerOf(progress.answers, key);
    if (saved && (saved.shape || saved.color || saved.icon || saved.name || saved.font || saved.nameColor)) continue;
    const c = identityChoices(silver, key, iconVentureId);
    const sample: BusinessIdentityAnswer = {
      kind: "business-identity",
      version: IDENTITY_ANSWER_VERSION,
      shape: c.shapes[0]?.id,
      color: (c.colors[1] ?? c.colors[0])?.hex.toUpperCase(),
      icon: c.icons[0]?.id,
      name: clampBusinessName(businessName).trim() || undefined,
      font: c.fonts[0]?.id,
      nameColor: c.nameColors[0]?.id,
      finalized: true,
    };
    next = setProgressAnswer(next, key, sample);
  }
  return fillPlanningSamples(next);
}

/** TEST-ONLY. Gives the workbook the Paws & Paths sample when a shortcut skipped the lessons. */
function fillPlanningSamples(progress: VentureTestProgress): VentureTestProgress {
  let next = progress;
  const costs = costsOf(next.answers, "l2-costs");
  const view = costs ? workbookView(costs) : null;
  if (view && isTaskDone(next, "l2-s2-b3-t1") && !priceOf(next.answers, SET_PRICE_ANSWER_KEY) && view.ongoing.length) {
    const prices = view.ongoing.map((service, i) => {
      const price = i === 0 ? 15 : 25;
      const costPerJob = service.perJob;
      return { serviceId: service.serviceId, price, costPerJob, keptPerJob: keptPerJob(price, costPerJob) };
    });
    const price: PriceAnswer = { kind: "price", version: 1, prices };
    next = setProgressAnswer(next, SET_PRICE_ANSWER_KEY, price);
    const typicalWeek = prices.map((row, i) => {
      const jobsPerWeek = i === 0 ? 3 : 1;
      return { serviceId: row.serviceId, jobsPerWeek, keptPerJob: row.keptPerJob, subtotal: Math.round(jobsPerWeek * row.keptPerJob * 100) / 100 };
    });
    const weekly = weeklyKeep(typicalWeek);
    const jobs: JobsAnswer = {
      kind: "jobs",
      version: 1,
      mode: prices.length > 1 ? "multi" : "single",
      startupTotal: view.startupTotal,
      weeksNeeded: weeksFromWeeklyKeep(view.startupTotal, weekly) ?? 0,
      typicalWeek,
      weeklyKeep: weekly,
    };
    next = setProgressAnswer(next, JOBS_COVER_ANSWER_KEY, jobs);
  }
  if (isTaskDone(next, "l2-s3-b1-t1") && !next.answers?.[FUNDING_ANSWER_KEY] && view) {
    const total = view.startupTotal;
    const count = 8;
    next = setProgressAnswer(next, FUNDING_ANSWER_KEY, {
      kind: "funding",
      version: 1,
      fundingSource: "borrow",
      startupTotal: total,
      currency: "USD",
      fundingRepayMode: "fixed_over_time",
      fundingRepayCount: count,
      fundingRepayUnit: "weeks",
      fundingPeriodPayment: Math.round((total / count) * 100) / 100,
    });
  }
  if (isTaskDone(next, "l2-s1-b1-t1") && !next.answers?.["l2-offer"]) {
    const selected = selectionOf(next.answers, "l1-offer")?.selected ?? ["dog-walking"];
    next = setProgressAnswer(next, "l2-offer", {
      kind: "offer",
      version: 1,
      offerings: selected.map((id) => ({
        serviceId: id,
        packages: id === "grooming" ? ["bath"] : id === "dog-training" ? ["basic-manners-session"] : ["30-minute-walk"],
        addons: id === "dog-walking" ? ["photo-updates"] : [],
      })),
      availability: ["weekday_morning", "weekday_afternoon", "weekend_morning"],
    });
  }
  if (isTaskDone(next, "l2-s1-b2-t1") && !next.answers?.["l2-customers"]) {
    next = setProgressAnswer(next, "l2-customers", {
      kind: "customer",
      version: 1,
      numberAsked: 3,
      yesNo: "yes",
      interests: ["30-minute-walk", "photo-updates", "after-school"],
    });
  }
  if (isTaskDone(next, "l2-s2-b2-t1") && !next.answers?.["l2-competitors"]) {
    next = setProgressAnswer(next, "l2-competitors", {
      kind: "competitor",
      version: 1,
      walkersChecked: 3,
      jobComparedId: "dog-walking",
      priceLow: 12,
      priceHigh: 20,
      addons: ["photo-updates", "treats"],
      doDifferently: "walk-one-dog-at-a-time",
    });
  }
  if (isTaskDone(next, "l3-s1-b1-t1") && !next.answers?.[FIND_CUSTOMERS_KEY]) {
    next = setProgressAnswer(next, FIND_CUSTOMERS_KEY, { kind: "find-customers", version: 1, channels: ["flyers", "friends", "noticeboard"] });
  }
  if (isTaskDone(next, "l3-s1-b2-t1") && !next.answers?.[AGREE_JOB_KEY]) {
    next = setProgressAnswer(next, AGREE_JOB_KEY, {
      kind: "agree-job",
      version: 1,
      understood: { collect_info: true, confirm_dog: true, when_where: false, cost_payment: true, plans_change: false },
    });
  }
  if (isTaskDone(next, "l3-s1-b3-t1") && !next.answers?.[DELIVER_JOB_KEY]) {
    next = setProgressAnswer(next, DELIVER_JOB_KEY, { kind: "deliver-job", version: 1, beforeHow: "text", afterHow: "photo" });
  }
  if (isTaskDone(next, "l3-s1-b4-t1") && !next.answers?.[WRAP_JOB_KEY]) {
    next = setProgressAnswer(next, WRAP_JOB_KEY, { kind: "wrap-job", version: 1, paymentHow: ["cash"], feedbackHow: ["in_person"] });
  }
  if (isTaskDone(next, "l3-s3-b1-t1") && !next.answers?.[PRACTICE_RUN_KEY]) {
    next = setProgressAnswer(next, PRACTICE_RUN_KEY, { kind: "practice-run", version: 1, who: "family", service: "dog-walking", when: "weekend" });
  }
  if (isTaskDone(next, "l3-s3-b2-t1") && !next.answers?.[POLISH_SERVICE_KEY]) {
    next = setProgressAnswer(next, POLISH_SERVICE_KEY, {
      kind: "polish-service",
      version: 1,
      rows: {
        service_explained: { result: "good" },
        cost: { result: "good" },
        timing: { result: "good" },
        communication: { result: "suggestions", suggestion: "Send a text when you are on your way, so the dog is ready." },
        delivery: { result: "good" },
        payment: { result: "good" },
        proof: { result: "good" },
      },
    });
  }
  return next;
}

function captureScreensOf(screens: LaunchpadSilver["bronzes"][number]["tasks"][number]["screens"]): CaptureScreen[] {
  const out: CaptureScreen[] = [];
  for (const sc of screens) {
    if (sc.type === "choice-capture" || sc.type === "rank-order" || sc.type === "short-text") out.push(sc);
    if (sc.type === "goal-loop") for (const g of sc.goals) out.push(g.screen);
  }
  return out;
}

/** TEST-ONLY sample text for short-text blanks, by "answerKey.field" (dog walking reads naturally). */
const SAMPLE_TEXT: Record<string, string> = {
  "l1-goal-make-money.savingFor": "a new bike",
  "l2-sell.serviceDescription": "30-minute neighborhood walks for small and medium dogs, with a photo after each walk",
  "l2-sell.availability": "weekday afternoons from 3 to 6 and Saturday mornings",
  "l2-demand.specificInterest": "after-school walks on weekdays",
};

const SAMPLE_NUMBER: Record<string, number> = { amount: 500, timeframeNumber: 6, donatePercent: 10, numberAsked: 3, customerCount: 10 };

function sampleFieldValue(answerKey: string, f: LaunchpadTextField): string | number | undefined {
  switch (f.input) {
    case "text":
      return SAMPLE_TEXT[`${answerKey}.${f.name}`] ?? `sample ${f.label.toLowerCase()}`;
    case "integer": {
      const n = SAMPLE_NUMBER[f.name] ?? f.min ?? 1;
      return Math.min(Math.max(n, f.min ?? 0), f.max ?? n);
    }
    case "currency":
      return readCurrencyPreference();
    case "choice":
      return f.options?.[0]?.id;
  }
}

/**
 * TEST-ONLY sample for one capture screen: the first two picks of a multi
 * choice (one for single), the authored ranking with nothing struck, and a
 * value in every blank. An optional screen (the extra goal) is left empty.
 */
export function shortcutSampleAnswer(screen: CaptureScreen): LaunchpadAnswer | null {
  if (screen.type === "choice-capture") return selectionAnswer(screen.options.slice(0, screen.mode === "multi" ? 2 : 1).map((o) => o.id));
  if (screen.type === "rank-order") return rankingAnswer(screen.items.map((i) => i.id));
  if (screen.optional) return null;
  let values: Record<string, string | number> = {};
  for (const f of screen.fields) {
    const v = sampleFieldValue(screen.answerKey, f);
    if (v !== undefined) values[f.name] = v;
  }
  // A pick that prefills a text field (the skill's success line) fills it as the learner would see it.
  for (const f of screen.fields) if (f.prefills && values[f.name] !== undefined) values = applyFieldChange(screen.fields, { ...values, [f.prefills]: "" }, f.name, values[f.name]!);
  return fieldsAnswer(values);
}

export type MilestoneView = {
  /** Finished silvers across the venture, and how many there are. */
  done: number;
  total: number;
  /** The next silver to do, or null when the venture is finished. */
  next: { level: number; floorName: string; silverTitle: string; newFloor: boolean } | null;
};

/** Milestone wrap-up numbers after a silver: "N of M steps done" and what is up next. */
export function milestoneView(progress: VentureTestProgress, floors: readonly LaunchpadFloor[], level: number): MilestoneView {
  const all = orderedSilvers(floors);
  const done = all.filter(({ silver }) => isSilverDone(progress, silver)).length;
  const ghost = handbookGhost(progress, floors);
  return {
    done,
    total: all.length,
    next: ghost ? { ...ghost, newFloor: ghost.level !== level } : null,
  };
}

/** Placeholder part titles ("Bronze 1") never reach the screen: they show as "Part 1". */
export function partLabel(title: string, i: number): string {
  return /\b(bronze|silver|gold)\b/i.test(title) ? `Part ${i + 1}` : title;
}

/** Placeholder titles like "Bronze 1" or "Silver 2" never reach the screen: the tier word shows as "Step". */
export function neutralTitle(title: string): string {
  return title.replace(/\b(bronze|silver|gold)\b/gi, "Step");
}
