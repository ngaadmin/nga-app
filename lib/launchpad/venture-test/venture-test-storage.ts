/**
 * STUB — TEST BUILD ONLY. Saves venture progress in this browser's
 * localStorage so the preview never writes to the shared database.
 *
 * A real backend would need a per-learner, per-venture table of completed
 * task ids (with RLS on the learner id), plus an onboarding "seen" flag per
 * venture. Nothing here talks to Supabase.
 */
import {
  EMPTY_VENTURE_TEST_PROGRESS,
  type VentureTestProgress,
} from "@/lib/launchpad/venture-test/venture-test-progress";

const KEY_PREFIX = "lp-venture-test:v1:";

export function ventureTestStorageKey(ventureId: string): string {
  return `${KEY_PREFIX}${ventureId}`;
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
      return { completedTaskIds: ids };
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

export function clearVentureTestProgress(ventureId: string): void {
  try {
    window.localStorage.removeItem(ventureTestStorageKey(ventureId));
  } catch {
    // Ignore.
  }
}
