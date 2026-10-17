import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { isDevClient } from "@/lib/dev/client-persist";

/** Dev / QA route for Academy template restyle. Not on the Academy map. */
export const ACADEMY_DESIGN_SHELL_PATH =
  "/dashboard/academy/lesson/shell" as const;

/**
 * Milestone ids that have a hard-coded lesson file.
 * Must match the keys of `LESSON_DEFINITIONS` in the lesson registry.
 */
export const DEFINITION_MILESTONE_IDS = [1, 2, 3, 4, 5] as const;

/**
 * Module 1 lessons played from Screens1.csv that have no hard-coded file.
 * Milestone id matches the lesson number inside module 1.
 */
export const BUNDLED_PAYLOAD_MILESTONE_IDS = [6, 7, 8, 9] as const;

const definitionIds = new Set<number>(DEFINITION_MILESTONE_IDS);
const bundledIds = new Set<number>(BUNDLED_PAYLOAD_MILESTONE_IDS);

export function hasShippedLesson(milestoneId: number): boolean {
  return definitionIds.has(milestoneId) || bundledIds.has(milestoneId);
}

export function bundledPayloadMilestone(
  milestoneId: number,
): { moduleNumber: number; lessonNumber: number } | undefined {
  if (milestoneId === 1 || bundledIds.has(milestoneId)) {
    return { moduleNumber: 1, lessonNumber: milestoneId };
  }
  return undefined;
}

/** Milestone ids the Academy map can open. Used to prebuild those lesson routes. */
export function listPlayableLessonMilestoneIds(): number[] {
  return [...definitionIds, ...bundledIds].sort((left, right) => left - right);
}

/**
 * Active (current) and completed lessons open when the lesson definition exists.
 * Do not use per-cohort `shippedCohorts` here — that was blocking the continue
 * node after lesson 2 for Maverick while the map still marked lesson 3 current.
 * Locked stays locked. Content still falls back Pathfinder → Maverick on resolve.
 */
export function canLaunchAcademyLesson(
  milestoneId: number,
  status: "active" | "completed" | "locked",
  _cohort: MasteryCohort,
): boolean {
  if (!hasShippedLesson(milestoneId)) {
    return false;
  }

  return status === "active" || status === "completed";
}

/** Dev-only: skip onboarding gates for the template lab, never for real lessons. */
export function isDevAcademyDesignShellPath(
  pathname: string | null | undefined,
): boolean {
  return isDevClient() && pathname === ACADEMY_DESIGN_SHELL_PATH;
}
