/**
 * The Launchpad handbook: the learner's business workbook.
 *
 * One page per COMPLETED silver, in building order (pages exist only for
 * completed silvers). The next silver shows as a faint ghost peeking behind
 * the last page. Everything here is derived from progress and the venture
 * content, so the handbook always reads the same saved answers the lessons
 * write (single source of truth).
 */
import type { LaunchpadFloor, LaunchpadSilver } from "@/lib/launchpad/content/types";
import { clampBusinessName, type BusinessIdentityAnswer } from "@/lib/launchpad/content/identity";
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
  /** "identity" pages render the saved identity answer; every other silver gets a placeholder page. */
  kind: "identity" | "placeholder";
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

/** One page per completed silver, in building order. */
export function handbookPages(progress: VentureTestProgress, floors: readonly LaunchpadFloor[]): HandbookPageView[] {
  return orderedSilvers(floors)
    .filter(({ silver }) => isSilverDone(progress, silver))
    .map(({ floor, silver, silverNumber }, i) => ({
      number: i + 1,
      level: floor.level,
      floorName: floor.name,
      silverNumber,
      silver,
      kind: silver.wrapUp?.type === "identity-wrap-up" ? "identity" : "placeholder",
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
  const i = pages.findIndex((p) => p.level === level);
  return i === -1 ? handbookOpenIndex(pages) : i;
}

/** The business name for the handbook header: the saved identity name, else the fallback (tile name). */
export function handbookBusinessName(progress: VentureTestProgress, floors: readonly LaunchpadFloor[], fallback: string): string {
  for (const { silver } of orderedSilvers(floors)) {
    const key = silver.wrapUp?.type === "identity-wrap-up" ? silver.wrapUp.answerKey : undefined;
    const name = key ? progress.answers?.[key]?.name?.trim() : undefined;
    if (name) return name;
  }
  return fallback;
}

/**
 * TEST-ONLY. A `?complete=` shortcut marks identity silvers done without the
 * learner ever picking anything. So the handbook's identity page has a logo to
 * show, fill a sample answer (the first option of every picker and the
 * business title as the name) for any completed identity silver that has no
 * saved picks yet. Existing answers are never overwritten.
 */
export function withShortcutSampleAnswers(
  progress: VentureTestProgress,
  floors: readonly LaunchpadFloor[],
  iconVentureId: string,
  businessName: string,
): VentureTestProgress {
  let next = progress;
  for (const { silver } of orderedSilvers(floors)) {
    if (silver.wrapUp?.type !== "identity-wrap-up" || !isSilverDone(progress, silver)) continue;
    const key = silver.wrapUp.answerKey;
    const saved = progress.answers?.[key];
    if (saved && (saved.shape || saved.color || saved.icon || saved.name || saved.font || saved.nameColor)) continue;
    const c = identityChoices(silver, key, iconVentureId);
    const sample: BusinessIdentityAnswer = {
      kind: "business-identity",
      version: 1,
      shape: c.shapes[0]?.id,
      color: c.colors[0]?.hex.toUpperCase(),
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
