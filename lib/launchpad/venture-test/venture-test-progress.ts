/**
 * TEST-ONLY progress logic for the Launchpad venture flow.
 *
 * Progress is a list of completed task ids. Everything else (which bronze
 * door, silver plaque and floor is done or current) is derived from it, so
 * a real backend only has to persist completed task ids per learner and
 * venture. See `venture-test-storage.ts` for the client-side stub.
 *
 * The floors come from the venture's content payload (database or bundled
 * seed), so any number of levels works (the r4 building has six).
 */
import type {
  LaunchpadBronze as VentureTestBronze,
  LaunchpadFloor as VentureTestFloor,
  LaunchpadSilver as VentureTestSilver,
} from "@/lib/launchpad/content/types";

export type VentureTestProgress = {
  completedTaskIds: readonly string[];
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
  return { completedTaskIds: [...progress.completedTaskIds, taskId] };
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
