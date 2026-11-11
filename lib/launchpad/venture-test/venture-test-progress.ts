/**
 * TEST-ONLY progress logic for the Launchpad venture flow.
 *
 * Progress is a list of completed task ids, plus the learner's saved answers
 * (capture and picker screens, keyed by answerKey; see content/answers.ts). Everything else (which bronze
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
import type { LaunchpadTask } from "@/lib/launchpad/content/types";
import type { LaunchpadAnswer, LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { isVentureTestEnabled } from "@/lib/launchpad/venture-test/venture-test-gate";

/** Test route only: Sales, Delivery, and Budgeting can be entered before earlier floors are done. */
const TEST_OPEN_FLOORS = new Set([4, 5, 6]);
/** Test route only: every door on Sales and Delivery is open, not waiting on the door before it. */
const TEST_OPEN_DOORS = new Set([4, 5]);

export function ventureTestFloorUnlocked(level: number): boolean {
  return isVentureTestEnabled() && TEST_OPEN_FLOORS.has(level);
}

export function ventureTestDoorsUnlocked(level: number): boolean {
  return isVentureTestEnabled() && TEST_OPEN_DOORS.has(level);
}

/**
 * A task's status. "locked" and "available" are always derived (the step
 * before is not yet done or open / it is); "open" (left with "Come back to
 * this later") and "done" are saved. Done is also listed in completedTaskIds,
 * which stays the source of truth so older saved progress reads the same.
 */
export type TaskStatus = "locked" | "available" | "open" | "done";

/** Saved state for a task the learner has left open (or finished after leaving it open). */
export type TaskProgressEntry = {
  status: Extract<TaskStatus, "open" | "done">;
  /** The partial answers (by answerKey) saved when the task was left open, until it is reopened. */
  draft?: LaunchpadAnswers;
  /** Page of a paged task the learner was on when they left it. */
  draftPage?: number;
  /** ISO time the task was first left open. */
  openedAt?: string;
};

export type VentureTestProgress = {
  completedTaskIds: readonly string[];
  /** Saved answers by answerKey (e.g. the business identity). Shaped to move to the DB as one JSON column. */
  answers?: LaunchpadAnswers;
  /** Per-task state, only for tasks left open at some point. Absent in progress saved before "Come back later". */
  tasks?: Readonly<Record<string, TaskProgressEntry>>;
};

export const EMPTY_VENTURE_TEST_PROGRESS: VentureTestProgress = {
  completedTaskIds: [],
};

export type NodeState = "done" | "current" | "locked";

export function isTaskDone(progress: VentureTestProgress, taskId: string): boolean {
  return progress.completedTaskIds.includes(taskId);
}

/** Left with "Come back to this later" and not finished since. */
export function isTaskOpen(progress: VentureTestProgress, taskId: string): boolean {
  return !isTaskDone(progress, taskId) && progress.tasks?.[taskId]?.status === "open";
}

/** Done or open: the learner has moved past it, so the step after it is unlocked. */
export function isTaskSettled(progress: VentureTestProgress, taskId: string): boolean {
  return isTaskDone(progress, taskId) || isTaskOpen(progress, taskId);
}

export function isBronzeSettled(progress: VentureTestProgress, bronze: VentureTestBronze): boolean {
  return bronze.tasks.every((t) => isTaskSettled(progress, t.id));
}

export function bronzeHasOpenTask(progress: VentureTestProgress, bronze: VentureTestBronze): boolean {
  return bronze.tasks.some((t) => isTaskOpen(progress, t.id));
}

/** Every bronze done or open: the wrap-up can be opened (but not confirmed while any task is open). */
export function isSilverSettled(progress: VentureTestProgress, silver: VentureTestSilver): boolean {
  return silver.bronzes.every((b) => isBronzeSettled(progress, b));
}

export type OpenTaskRef = {
  level: number;
  silverId: string;
  bronzeId: string;
  taskId: string;
  taskIndex: number;
  title: string;
};

/** Open tasks in a silver, in order. */
export function openTasksInSilver(progress: VentureTestProgress, silver: VentureTestSilver, level = 0): OpenTaskRef[] {
  return silver.bronzes.flatMap((b) =>
    b.tasks.flatMap((t, taskIndex) =>
      isTaskOpen(progress, t.id)
        ? [{ level, silverId: silver.id, bronzeId: b.id, taskId: t.id, taskIndex, title: b.tasks.length > 1 ? t.title : b.title }]
        : [],
    ),
  );
}

/** Open tasks across the whole business (the home tile's count). */
export function openTasks(progress: VentureTestProgress, floors: readonly VentureTestFloor[]): OpenTaskRef[] {
  return floors.flatMap((f) => f.silvers.flatMap((s) => openTasksInSilver(progress, s, f.level)));
}

export function openTaskCount(progress: VentureTestProgress, floors: readonly VentureTestFloor[]): number {
  return openTasks(progress, floors).length;
}

/**
 * A task's status: done and open as saved; otherwise available when its
 * silver is open and every task before it in the silver is done or open,
 * else locked.
 */
export function taskStatus(progress: VentureTestProgress, floors: readonly VentureTestFloor[], taskId: string): TaskStatus {
  if (isTaskDone(progress, taskId)) return "done";
  if (isTaskOpen(progress, taskId)) return "open";
  for (const floor of floors) {
    const states = silverStates(progress, floors, floor);
    for (const [si, silver] of floor.silvers.entries()) {
      const ids = silver.bronzes.flatMap((b) => b.tasks.map((t) => t.id));
      const i = ids.indexOf(taskId);
      if (i === -1) continue;
      if (states[si] === "locked") return "locked";
      return ids.slice(0, i).every((id) => isTaskSettled(progress, id)) ? "available" : "locked";
    }
  }
  return "locked";
}

/** Every answerKey a task's screens save (goal-loop goals included). */
export function taskAnswerKeys(task: Pick<LaunchpadTask, "screens">): string[] {
  const keys: string[] = [];
  for (const sc of task.screens) {
    if (sc.type === "goal-loop") for (const g of sc.goals) keys.push(g.screen.answerKey);
    else if ("answerKey" in sc && typeof sc.answerKey === "string") keys.push(sc.answerKey);
  }
  return [...new Set(keys)];
}

/**
 * "Come back to this later": moves the task's partial answers into its
 * draft, marks it open (keeping the first openedAt) and remembers the page.
 * The next task unlocks because an open task counts as settled.
 */
export function deferTask(
  progress: VentureTestProgress,
  task: Pick<LaunchpadTask, "id" | "screens">,
  opts: { page?: number; now?: string } = {},
): VentureTestProgress {
  if (isTaskDone(progress, task.id)) return progress;
  const answers: Record<string, LaunchpadAnswer> = { ...progress.answers };
  const prev = progress.tasks?.[task.id];
  const draft: Record<string, LaunchpadAnswer> = { ...prev?.draft };
  for (const key of taskAnswerKeys(task)) {
    if (answers[key] === undefined) continue;
    draft[key] = answers[key]!;
    delete answers[key];
  }
  const entry: TaskProgressEntry = {
    status: "open",
    ...(Object.keys(draft).length ? { draft } : {}),
    ...(opts.page ? { draftPage: opts.page } : {}),
    openedAt: prev?.openedAt ?? opts.now ?? new Date().toISOString(),
  };
  const next: VentureTestProgress = { ...progress, tasks: { ...progress.tasks, [task.id]: entry } };
  if (Object.keys(answers).length) next.answers = answers;
  else delete next.answers;
  return next;
}

/**
 * Reopening an open task: its draft goes back into the answers (so its
 * screens show it) and the task stays open until it is completed.
 */
export function restoreTaskDraft(progress: VentureTestProgress, taskId: string): VentureTestProgress {
  const entry = progress.tasks?.[taskId];
  if (!entry?.draft || !isTaskOpen(progress, taskId)) return progress;
  const { draft, ...rest } = entry;
  return {
    ...progress,
    answers: { ...draft, ...progress.answers },
    tasks: { ...progress.tasks, [taskId]: rest },
  };
}

/** Saved page of an open task (0 when none). */
export function draftPageOf(progress: VentureTestProgress, taskId: string): number {
  return isTaskOpen(progress, taskId) ? (progress.tasks?.[taskId]?.draftPage ?? 0) : 0;
}

export function isBronzeDone(progress: VentureTestProgress, bronze: VentureTestBronze): boolean {
  return bronze.tasks.every((t) => progress.completedTaskIds.includes(t.id));
}

/** A placeholder among real doors stays locked and is not required to finish the plaque. */
function skippedPlaceholder(silver: VentureTestSilver, bronze: VentureTestBronze): boolean {
  return bronze.placeholder && silver.bronzes.some((door) => !door.placeholder);
}

export function isSilverDone(progress: VentureTestProgress, silver: VentureTestSilver): boolean {
  return silver.bronzes.every((b) => skippedPlaceholder(silver, b) || isBronzeDone(progress, b));
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
  if (ventureTestFloorUnlocked(level)) return "current";
  return level === currentLevel(progress, floors) ? "current" : "locked";
}

/** Plaque states on a floor: done ones first, one current, the rest locked. */
export function silverStates(
  progress: VentureTestProgress,
  floors: readonly VentureTestFloor[],
  floor: VentureTestFloor,
): NodeState[] {
  const open = floorState(progress, floors, floor.level) !== "locked";
  if (open && ventureTestDoorsUnlocked(floor.level)) {
    return floor.silvers.map((s) => (isSilverDone(progress, s) ? "done" : "current"));
  }
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
/**
 * Pricing doors. Placeholder doors (competitor research) stay locked and do
 * not block the next built door. A built door opens once every earlier built
 * door is done.
 */
export function pricingBronzeStates(progress: VentureTestProgress, silver: VentureTestSilver, open = true): NodeState[] {
  let blocked = false;
  return silver.bronzes.map((bronze) => {
    if (bronze.placeholder) return "locked";
    if (isBronzeDone(progress, bronze)) return "done";
    if (!open || blocked) return "locked";
    if (!isBronzeSettled(progress, bronze)) blocked = true;
    return "current";
  });
}

export function bronzeStates(progress: VentureTestProgress, silver: VentureTestSilver, open = true, independent = false): NodeState[] {
  // A door left open ("Come back") stays current and does not block the next door.
  // A placeholder beside real doors (the Level 4 pitch) stays locked and does not gate the next door.
  // `independent` opens every built door at once. The test route uses it for Sales and Delivery.
  let blocked = false;
  return silver.bronzes.map((b) => {
    if (skippedPlaceholder(silver, b)) return "locked";
    if (isBronzeDone(progress, b)) return "done";
    if (!open || blocked) return "locked";
    if (!independent && !isBronzeSettled(progress, b)) blocked = true;
    return "current";
  });
}

export function completeTask(progress: VentureTestProgress, taskId: string): VentureTestProgress {
  if (progress.completedTaskIds.includes(taskId)) return progress;
  const next: VentureTestProgress = { ...progress, completedTaskIds: [...progress.completedTaskIds, taskId] };
  const entry = progress.tasks?.[taskId];
  if (entry) {
    // A task finished after being left open: done, draft gone, openedAt kept.
    next.tasks = { ...progress.tasks, [taskId]: { status: "done", ...(entry.openedAt ? { openedAt: entry.openedAt } : {}) } };
  }
  return next;
}

/** Saves one answer, keeping progress and the other answers. */
export function setProgressAnswer(
  progress: VentureTestProgress,
  answerKey: string,
  answer: LaunchpadAnswer,
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

/**
 * Which task tapping a bronze door opens. There is no task list: the door goes
 * straight into the first unfinished task, or the first task when the bronze is
 * done (review), and the workbook then steps task to task.
 */
export function bronzeEntryTaskIndex(progress: VentureTestProgress, bronze: VentureTestBronze): number {
  return firstOpenTaskIndex(progress, bronze);
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
    // Tasks left open are skipped: the learner comes back to them from the door.
    const next = bronze.tasks.findIndex((t, i) => i > taskIndex && !isTaskSettled(progress, t.id));
    if (next !== -1) return { kind: "task", taskIndex: next };
    const first = bronze.tasks.findIndex((t) => !isTaskSettled(progress, t.id));
    if (first !== -1) return { kind: "task", taskIndex: first };
    return { kind: "bronze-done" };
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
  | { kind: "all"; land: "rooftop" | "building" | "build-complete" }
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
 * - `?buildComplete=1`: everything complete, open the business-build celebration.
 *   It does not replace the rooftop finish. `?rooftop=1` still wins when both are set.
 * - `?complete=all`: everything complete, land on the building.
 * - `?complete=<silver id>` (e.g. `l2-s1`): every silver up to and including
 *   that one complete, land in the corridor of the next open silver.
 * - `?level=<n>`: every floor below n complete, land in Level n's corridor.
 * Precedence: rooftop, then buildComplete, then complete, then level.
 */
export function ventureTestShortcut(params: {
  rooftop?: string;
  buildComplete?: string;
  complete?: string;
  level?: string;
}): VentureTestShortcut | null {
  if (params.rooftop === "1") return { kind: "all", land: "rooftop" };
  if (params.buildComplete === "1") return { kind: "all", land: "build-complete" };
  if (params.complete === "all") return { kind: "all", land: "building" };
  if (params.complete && SILVER_ID_PARAM_RE.test(params.complete)) return { kind: "through-silver", silverId: params.complete };
  if (params.level && LEVEL_PARAM_RE.test(params.level)) return { kind: "level", level: Number(params.level) };
  return null;
}

export type VentureTestShortcutLanding =
  | { screen: "rooftop" }
  | { screen: "build-complete" }
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
