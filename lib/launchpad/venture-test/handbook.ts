/**
 * The Launchpad handbook: the learner's business workbook.
 *
 * One page per COMPLETED silver, in building order (pages exist only for
 * completed silvers). The next silver shows as a faint ghost peeking behind
 * the last page. Everything here is derived from progress and the venture
 * content, so the handbook always reads the same saved answers the lessons
 * write (single source of truth).
 */
import type { LaunchpadFloor, LaunchpadSilver, LaunchpadTextField } from "@/lib/launchpad/content/types";
import { fieldsAnswer, identityAnswerOf, rankingAnswer, selectionAnswer, type LaunchpadAnswer } from "@/lib/launchpad/content/answers";
import type { CaptureScreen } from "@/lib/launchpad/content/task-pages";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import { clampBusinessName, IDENTITY_ANSWER_VERSION, type BusinessIdentityAnswer } from "@/lib/launchpad/content/identity";
import { identityChoices } from "@/lib/launchpad/content/identity-content";
import {
  currentLevel,
  isBronzeDone,
  isFloorDone,
  isSilverDone,
  setProgressAnswer,
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
   * "identity": the saved identity answer (logo and name) plus its handbook
   * sections; "summary": a workbook-summary silver's sections from saved
   * answers; "placeholder": any other silver.
   */
  kind: "cover" | "identity" | "summary" | "placeholder";
  /** Titles of the silver's finished bronzes (written out under plain headings on placeholder pages). */
  bronzeTitles: string[];
  done: true;
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
 * the workbook has any page, when the venture has an identity silver with a
 * vision. Then one page per completed silver, in building order.
 */
export function handbookPages(progress: VentureTestProgress, floors: readonly LaunchpadFloor[]): HandbookPageView[] {
  const pages = silverPages(progress, floors);
  const id = orderedSilvers(floors).find(({ silver }) => silver.wrapUp?.type === "identity-wrap-up" && silver.wrapUp.vision);
  if (!pages.length || !id) return pages;
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
  return [cover, ...pages.map((p) => ({ ...p, number: p.number + 1 }))];
}

function silverPages(progress: VentureTestProgress, floors: readonly LaunchpadFloor[]): HandbookPageView[] {
  return orderedSilvers(floors)
    .filter(({ silver }) => isSilverDone(progress, silver))
    .map(({ floor, silver, silverNumber }, i) => ({
      number: i + 1,
      level: floor.level,
      floorName: floor.name,
      silverNumber,
      silver,
      kind: silver.wrapUp?.type === "identity-wrap-up" ? "identity" : silver.wrapUp?.type === "workbook-summary" ? "summary" : "placeholder",
      bronzeTitles: silver.bronzes.filter((b) => isBronzeDone(progress, b)).map((b) => b.title),
      done: true,
    }));
}

/** The next silver to earn (the ghost page), or null once every silver is done. */
export function handbookGhost(progress: VentureTestProgress, floors: readonly LaunchpadFloor[]): HandbookGhostView | null {
  const next = orderedSilvers(floors).find(({ silver }) => !isSilverDone(progress, silver));
  return next ? { level: next.floor.level, floorName: next.floor.name, silverTitle: next.silver.title } : null;
}

/** The handbook opens at the latest page (the most recently earned silver). */
export function handbookOpenIndex(pages: readonly HandbookPageView[]): number {
  return Math.max(0, pages.length - 1);
}

/** The book button shows only once the business has at least one completed silver (one page). */
export function hasHandbook(progress: VentureTestProgress, floors: readonly LaunchpadFloor[]): boolean {
  return orderedSilvers(floors).some(({ silver }) => isSilverDone(progress, silver));
}

/**
 * Can this page be edited inline? Only from the building screen, and only
 * for a completed silver. From home the handbook is read-only; the ghost
 * (an unfinished silver) is never editable. Placeholder pages pass this check
 * but have nothing to edit.
 */
export function isHandbookPageEditable(entry: HandbookEntry, silverDone: boolean): boolean {
  return entry === "building" && silverDone;
}

/** L1 to L6 thumb index. Earned and current floors can be tapped; unearned ones cannot. */
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
  return i === -1 ? handbookOpenIndex(pages) : i;
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
  "l1-goal-help-others.benefit": "have happy, tired dogs after a long day",
  "l1-goal-learn-new-skills.skill": "how to handle two dogs at once",
  "l2-sell.serviceDescription": "30-minute neighborhood walks for small and medium dogs, with a photo after each walk",
  "l2-sell.availability": "weekday afternoons from 3 to 6 and Saturday mornings",
  "l2-demand.specificInterest": "after-school walks on weekdays",
};

const SAMPLE_NUMBER: Record<string, number> = { amount: 500, timeframeNumber: 6, donatePercent: 10, numberAsked: 3 };

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
  const values: Record<string, string | number> = {};
  for (const f of screen.fields) {
    const v = sampleFieldValue(screen.answerKey, f);
    if (v !== undefined) values[f.name] = v;
  }
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
