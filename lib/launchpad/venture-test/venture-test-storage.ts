/**
 * STUB — TEST BUILD ONLY. Saves venture progress in this browser's
 * localStorage so the preview never writes to the shared database.
 *
 * Each task left with "Come back to this later" also has an entry in
 * `tasks` (status, draft answers, openedAt). Proposed (not built) DB mapping: a status column and a draft jsonb on
 * launchpad_learner_answers.
 *
 * A real backend would need a per-learner, per-venture table of completed
 * task ids and saved answers (one JSON column keyed by answerKey; see
 * lib/launchpad/content/identity.ts), with RLS on the learner id, plus an onboarding "seen" flag per
 * venture (stubbed here as a second localStorage key). Nothing here talks to Supabase.
 */
import { parseLaunchpadAnswers } from "@/lib/launchpad/content/answers";
import {
  EMPTY_VENTURE_TEST_PROGRESS,
  type TaskProgressEntry,
  type VentureTestProgress,
} from "@/lib/launchpad/venture-test/venture-test-progress";

const KEY_PREFIX = "lp-venture-test:v1:";

export function ventureTestStorageKey(ventureId: string): string {
  return `${KEY_PREFIX}${ventureId}`;
}

/**
 * Per-task state ("Come back to this later"). Missing in progress saved
 * before the feature, which then reads exactly as before. Bad entries are
 * dropped; a task listed in completedTaskIds is done whatever its entry says.
 */
function parseTaskEntries(raw: unknown, completed: readonly string[]): Record<string, TaskProgressEntry> {
  const out: Record<string, TaskProgressEntry> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const v = value as { status?: unknown; draft?: unknown; draftPage?: unknown; openedAt?: unknown };
    if (v.status !== "open" && v.status !== "done") continue;
    const status = completed.includes(id) ? "done" : v.status;
    const draft = status === "open" ? parseLaunchpadAnswers(v.draft) : {};
    const draftPage = status === "open" && typeof v.draftPage === "number" && Number.isInteger(v.draftPage) && v.draftPage > 0 ? v.draftPage : undefined;
    out[id] = {
      status,
      ...(Object.keys(draft).length ? { draft } : {}),
      ...(draftPage ? { draftPage } : {}),
      ...(typeof v.openedAt === "string" ? { openedAt: v.openedAt } : {}),
    };
  }
  return out;
}

export function parseVentureTestProgress(raw: string | null): VentureTestProgress {
  if (!raw) return EMPTY_VENTURE_TEST_PROGRESS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { completedTaskIds?: unknown }).completedTaskIds)
    ) {
      const ids = (parsed as { completedTaskIds: unknown[] }).completedTaskIds.filter(
        (id): id is string => typeof id === "string",
      );
      const answers = parseLaunchpadAnswers((parsed as { answers?: unknown }).answers);
      // Tell people about it stays l4-s1-b4. A save from the brief rename to l4-s1-b3 still counts when that answer is present.
      if (answers.tell_people && ids.includes("l4-s1-b3-t1") && !ids.includes("l4-s1-b4-t1")) ids.push("l4-s1-b4-t1");
      const tasks = parseTaskEntries((parsed as { tasks?: unknown }).tasks, ids);
      const complete = (parsed as { complete?: unknown }).complete === true;
      return {
        completedTaskIds: ids,
        ...(Object.keys(answers).length ? { answers } : {}),
        ...(Object.keys(tasks).length ? { tasks } : {}),
        ...(complete ? { complete: true } : {}),
      };
    }
  } catch {
    // Fall through to empty progress.
  }
  return EMPTY_VENTURE_TEST_PROGRESS;
}

export function loadVentureTestProgress(ventureId: string): VentureTestProgress {
  try {
    return parseVentureTestProgress(window.localStorage.getItem(ventureTestStorageKey(ventureId)));
  } catch {
    return EMPTY_VENTURE_TEST_PROGRESS;
  }
}

export function saveVentureTestProgress(ventureId: string, progress: VentureTestProgress): void {
  try {
    window.localStorage.setItem(ventureTestStorageKey(ventureId), JSON.stringify(progress));
  } catch {
    // Private mode or storage full: progress lives in memory for this visit.
  }
}

export function ventureTestOnboardingKey(ventureId: string): string {
  return `${KEY_PREFIX}${ventureId}:onboarding-seen`;
}

/** True once the building intro has been shown for this venture in this browser. */
export function hasSeenVentureTestOnboarding(ventureId: string): boolean {
  try {
    return window.localStorage.getItem(ventureTestOnboardingKey(ventureId)) === "1";
  } catch {
    return false;
  }
}

export function markVentureTestOnboardingSeen(ventureId: string): void {
  try {
    window.localStorage.setItem(ventureTestOnboardingKey(ventureId), "1");
  } catch {
    // Private mode: the intro may show again next visit.
  }
}

/** Clears progress and the intro "seen" flag (used by ?reset=1). */
export function clearVentureTestProgress(ventureId: string): void {
  try {
    window.localStorage.removeItem(ventureTestStorageKey(ventureId));
    window.localStorage.removeItem(ventureTestOnboardingKey(ventureId));
  } catch {
    // Ignore.
  }
}
