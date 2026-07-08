import {
  readAcademyMilestones,
  saveAcademyMilestones,
} from "@/lib/dashboard/academy-progress-storage";
import {
  createPhase1MilestoneScaffold,
  type AcademyLessonMilestoneNode,
} from "@/lib/dashboard/academy-state";
import { SHIPPED_ACADEMY_LESSON_IDS } from "@/lib/academy/lessons/registry";
import { isDevClient } from "@/lib/dev/client-persist";

/** Set journey progress so `milestoneId` is the active node (earlier = completed). Dev only. */
export function focusAcademyMilestone(
  milestoneId: number,
): AcademyLessonMilestoneNode[] {
  if (!isDevClient()) {
    return readAcademyMilestones();
  }

  const id = Math.max(1, Math.floor(milestoneId));
  const milestones = createPhase1MilestoneScaffold(id);
  saveAcademyMilestones(milestones);
  return milestones;
}

/** `?focus=3` on /dashboard/academy — dev shortcut to unlock lesson 3 on the map. */
export function parseAcademyFocusParam(search: string): number | null {
  if (!isDevClient()) return null;

  const raw = new URLSearchParams(search).get("focus");
  if (!raw) return null;

  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id) || id < 1) return null;
  return id;
}

export const SHIPPED_DEV_LESSON_JUMP_IDS = [
  ...SHIPPED_ACADEMY_LESSON_IDS,
].sort((a, b) => a - b);
