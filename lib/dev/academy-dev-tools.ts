import type { AcademyLessonMilestoneNode } from "@/lib/dashboard/academy-state";
import { isDevClient } from "@/lib/dev/client-persist";

/** M1-L1 … M1-L4 stay tappable on the Academy map during local development. */
export const DEV_TESTING_UNLOCKED_LESSON_IDS = [1, 2, 3, 4] as const;

const DEV_TESTING_UNLOCKED_SET = new Set<number>(DEV_TESTING_UNLOCKED_LESSON_IDS);

/** Dev-only display overlay: shipped test lessons render as active instead of locked. */
export function applyDevShippedLessonUnlocks(
  milestones: readonly AcademyLessonMilestoneNode[],
): AcademyLessonMilestoneNode[] {
  if (!isDevClient()) {
    return [...milestones];
  }

  return milestones.map((node) => {
    if (DEV_TESTING_UNLOCKED_SET.has(node.id) && node.status === "locked") {
      return { ...node, status: "active" as const };
    }
    return node;
  });
}

export function isDevTestingUnlockedLesson(milestoneId: number): boolean {
  return isDevClient() && DEV_TESTING_UNLOCKED_SET.has(milestoneId);
}

export const SHIPPED_DEV_LESSON_JUMP_IDS = [...DEV_TESTING_UNLOCKED_LESSON_IDS];
