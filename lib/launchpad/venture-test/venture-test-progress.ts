/**
 * TEST-ONLY progress logic for the Launchpad venture flow.
 *
 * Progress is a list of completed task ids, plus the learner's saved answers
 * (picker screens, keyed by answerKey). Everything else (which bronze
 * door, silver plaque and floor is done or current) is derived from it, so
 * a real backend only has to persist completed task ids and answers per
 * learner and venture. See `venture-test-storage.ts` for the client-side stub.
 *
 * The floors come from the venture's content payload (database or bundled
 * seed), so any number of levels works (the r4 building has six).
 */
import type {
  LaunchpadBronze as VentureTestBronze,
  LaunchpadFloor as VentureTestFloor,
  LaunchpadSilver as VentureTestSilver,
} from "@/lib/launchpad/content/types";
import type { BusinessIdentityAnswer, LaunchpadAnswers } from "@/lib/launchpad/content/identity";

export type VentureTestProgress = {
  completedTaskIds: readonly string[];
  /** Saved answers by answerKey (e.g. the business identity). Shaped to move to the DB as one JSON column. */
  answers?: LaunchpadAnswers;
};

export const EMPTY_VENTURE_TEST_PROGRESS: VentureTestProgress = {
  completedTaskIds: [],
};

export type NodeState = "done" | "current" | "locked";

export function isBronzeDone(progress: VentureTestProgress, bronze: VentureTestBronze): boolean {
  return bronze.tasks.every((t) => progress.completedTaskIds.includes(t.id));
}

export function isSilverDone(progress: VentureTestProgress, silver: VentureTestSilver): boolean {
  return silver.bronzes.every((b) => isBronzeDone(progress, b));
}

export function isFloorDone(progress: VentureTestProgress, floor: VentureTestFloor): boolean {
  return floor.silvers.every((s) => isSilverDone(progress, s));
}

/** The first floor that is not done (the top floor once everything is done). */
export function currentLevel(progress: VentureTestProgress, floors: readonly VentureTestFloor[]): number {
  const open = floors.find((f) => !isFloorDone(progress, f));
  return open ? open.level : floors.length;
}

export function floorState(
  progress: VentureTestProgress,
  floors: readonly VentureTestFloor[],
  level: number,
): NodeState {
  const floor = floors.find((f) => f.level === level);
  if (!floor) throw new Error(`Unknown venture floor: ${level}`);
  if (isFloorDone(progress, floor)) return "done";
  return level === currentLevel(progress, floors) ? "current" : "locked";
}

/** Plaque states on a floor: done ones first, one current, the rest locked. */
export function silverStates(
  progress: VentureTestProgress,
  floors: readonly VentureTestFloor[],
  floor: VentureTestFloor,
): NodeState[] {
  const open = floorState(progress, floors, floor.level) !== "locked";
  let seenCurrent = false;
  return floor.silvers.map((s) => {
    if (isSilverDone(progress, s)) return "done";
    if (open && !seenCurrent) {
      seenCurrent = true;
      return "current";
    }
    return "locked";
  });
}

/**
 * Door states inside a silver: done ones first, one current, the rest locked.
 * Every plaque can be tapped, so when the silver itself is locked (`open` is
 * false) no door is current and the learner can only look.
 */
export function bronzeStates(progress: VentureTestProgress, silver: VentureTestSilver, open = true): NodeState[] {
  let seenCurrent = false;
  return silver.bronzes.map((b) => {
    if (isBronzeDone(progress, b)) return "done";
    if (open && !seenCurrent) {
      seenCurrent = true;
      return "current";
    }
    return "locked";
  });
}

export function completeTask(progress: VentureTestProgress, taskId: string): VentureTestProgress {
  if (progress.completedTaskIds.includes(taskId)) return progress;
  return { ...progress, completedTaskIds: [...progress.completedTaskIds, taskId] };
}

/** Saves one answer, keeping progress and the other answers. */
export function setProgressAnswer(
  progress: VentureTestProgress,
  answerKey: string,
  answer: BusinessIdentityAnswer,
): VentureTestProgress {
  return { ...progress, answers: { ...progress.answers, [answerKey]: answer } };
}

export function tasksDoneCount(progress: VentureTestProgress, bronze: VentureTestBronze): number {
  return bronze.tasks.filter((t) => progress.completedTaskIds.includes(t.id)).length;
}

/** Index of the first task not done, or 0 when all are done. */
export function firstOpenTaskIndex(progress: VentureTestProgress, bronze: VentureTestBronze): number {
  const i = bronze.tasks.findIndex((t) => !progress.completedTaskIds.includes(t.id));
  return i === -1 ? 0 : i;
}

export type WorkbookAdvance =
  | { kind: "task"; taskIndex: number }
  | { kind: "bronze-done" }
  | { kind: "silver-done" }
  | { kind: "floor-done" };

/**
 * Where the workbook goes after the learner finishes the task at `taskIndex`.
 * The learner stays in the workbook until every task is done; then the flow
 * goes back to the doors, the corridor, or the level-complete corridor.
 */
export function advanceAfterTask(
  progress: VentureTestProgress,
  floor: VentureTestFloor,
  silver: VentureTestSilver,
  bronze: VentureTestBronze,
  taskIndex: number,
): WorkbookAdvance {
  if (!isBronzeDone(progress, bronze)) {
    const next = bronze.tasks.findIndex(
      (t, i) => i > taskIndex && !progress.completedTaskIds.includes(t.id),
    );
    if (next !== -1) return { kind: "task", taskIndex: next };
    return { kind: "task", taskIndex: firstOpenTaskIndex(progress, bronze) };
  }
  if (!isSilverDone(progress, silver)) return { kind: "bronze-done" };
  if (!isFloorDone(progress, floor)) return { kind: "silver-done" };
  return { kind: "floor-done" };
}

/** True once every floor in the building is done. */
export function isBuildingDone(progress: VentureTestProgress, floors: readonly VentureTestFloor[]): boolean {
  return floors.length > 0 && floors.every((f) => isFloorDone(progress, f));
}

/**
 * What tapping a floor on the building does. Every floor opens its corridor:
 * done floors and the current floor can be entered (done ones fully
 * re-entered for review), floors above the current one are preview only
 * (locked plaques, read-only doors, nothing can be started).
 */
export type FloorAccess = "enter" | "preview";

export function floorAccess(
  progress: VentureTestProgress,
  floors: readonly VentureTestFloor[],
  level: number,
): FloorAccess {
  return floorState(progress, floors, level) === "locked" ? "preview" : "enter";
}

/**
 * The building screen's bottom button: always "Go to Level N" for the level
 * the learner is working on (whatever floor they previewed), or the rooftop
 * finish once every floor is done.
 */
export type BuildingCta = { kind: "level"; level: number; label: string } | { kind: "rooftop"; label: string };

export function buildingCta(progress: VentureTestProgress, floors: readonly VentureTestFloor[]): BuildingCta {
  if (isBuildingDone(progress, floors)) return { kind: "rooftop", label: "Go to the rooftop" };
  const level = currentLevel(progress, floors);
  return { kind: "level", level, label: `Go to Level ${level}` };
}

/**
 * Note on a plaque's doors when that plaque is still locked. On a preview
 * floor (above the current one) it names the level to finish; on the current
 * floor it names the plaque before it.
 */
export function lockedDoorsNote(
  progress: VentureTestProgress,
  floors: readonly VentureTestFloor[],
  floor: VentureTestFloor,
  silverIndex: number,
): string | undefined {
  const state = silverStates(progress, floors, floor)[silverIndex];
  if (state !== "locked") return undefined;
  const prevTitle = floor.silvers[silverIndex - 1]?.title;
  if (floorState(progress, floors, floor.level) === "locked" || !prevTitle)
    return `Finish Level ${floor.level - 1} to unlock these doors.`;
  return `Finish "${prevTitle}" to unlock these doors.`;
}

/** TEST-ONLY: progress with every task of every floor complete (used by ?rooftop=1 / ?complete=all). */
export function allTasksCompleteProgress(floors: readonly VentureTestFloor[]): VentureTestProgress {
  return {
    completedTaskIds: floors.flatMap((f) => f.silvers.flatMap((s) => s.bronzes.flatMap((b) => b.tasks.map((t) => t.id)))),
  };
}

/** A TEST-ONLY URL shortcut (see ventureTestShortcut). */
export type VentureTestShortcut =
  /** Every task complete; land on the rooftop finish or the building. */
  | { kind: "all"; land: "rooftop" | "building" }
  /** Every floor below `level` complete; land in that floor's corridor. */
  | { kind: "level"; level: number }
  /** Every silver up to and including `silverId` complete; land in the corridor of the next open silver. */
  | { kind: "through-silver"; silverId: string };

/** The venture opened by a shortcut when `?venture=` is not given. */
export const VENTURE_TEST_SHORTCUT_DEFAULT_VENTURE = "dog-walking";

const SILVER_ID_PARAM_RE = /^l\d{1,2}-s\d{1,2}$/;
const LEVEL_PARAM_RE = /^[1-9]\d?$/;

/**
 * TEST-ONLY URL shortcuts:
 * - `?rooftop=1`: everything complete, open the rooftop finish screen.
 * - `?complete=all`: everything complete, land on the building.
 * - `?complete=<silver id>` (e.g. `l2-s1`): every silver up to and including
 *   that one complete, land in the corridor of the next open silver.
 * - `?level=<n>`: every floor below n complete, land in Level n's corridor.
 * Precedence: rooftop, then complete, then level.
 */
export function ventureTestShortcut(params: {
  rooftop?: string;
  complete?: string;
  level?: string;
}): VentureTestShortcut | null {
  if (params.rooftop === "1") return { kind: "all", land: "rooftop" };
  if (params.complete === "all") return { kind: "all", land: "building" };
  if (params.complete && SILVER_ID_PARAM_RE.test(params.complete)) return { kind: "through-silver", silverId: params.complete };
  if (params.level && LEVEL_PARAM_RE.test(params.level)) return { kind: "level", level: Number(params.level) };
  return null;
}

export type VentureTestShortcutLanding =
  | { screen: "rooftop" }
  | { screen: "building" }
  | { screen: "corridor"; level: number };

/**
 * Progress for a shortcut and where it lands, or null when the shortcut does
 * not fit this venture (unknown level or silver). Saved answers are kept.
 */
export function applyVentureTestShortcut(
  shortcut: VentureTestShortcut,
  floors: readonly VentureTestFloor[],
  progress: VentureTestProgress,
): { progress: VentureTestProgress; land: VentureTestShortcutLanding } | null {
  const taskIds = (silvers: readonly VentureTestSilver[]) =>
    silvers.flatMap((s) => s.bronzes.flatMap((b) => b.tasks.map((t) => t.id)));
  if (shortcut.kind === "all") {
    return { progress: { ...progress, ...allTasksCompleteProgress(floors) }, land: { screen: shortcut.land } };
  }
  if (shortcut.kind === "level") {
    if (!floors.some((f) => f.level === shortcut.level)) return null;
    const below = floors.filter((f) => f.level < shortcut.level).flatMap((f) => f.silvers);
    return {
      progress: { ...progress, completedTaskIds: taskIds(below) },
      land: { screen: "corridor", level: shortcut.level },
    };
  }
  const ordered = floors.flatMap((f) => f.silvers);
  const end = ordered.findIndex((s) => s.id === shortcut.silverId);
  if (end === -1) return null;
  const next: VentureTestProgress = { ...progress, completedTaskIds: taskIds(ordered.slice(0, end + 1)) };
  return { progress: next, land: { screen: "corridor", level: currentLevel(next, floors) } };
}
