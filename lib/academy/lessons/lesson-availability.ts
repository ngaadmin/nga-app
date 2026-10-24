import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { isDevClient } from "@/lib/dev/client-persist";

/** Dev / QA route for Academy template restyle. Not on the Academy map. */
export const ACADEMY_DESIGN_SHELL_PATH =
  "/dashboard/academy/lesson/shell" as const;

/**
 * Milestone ids whose hard-coded lesson file is still registered.
 * Must match the keys of `LESSON_DEFINITIONS` in the lesson registry.
 * Module 1 lessons 1–9 keep their old files on disk, but those files are not registered.
 */
export const DEFINITION_MILESTONE_IDS = [] as const;

/**
 * Module 1 lessons played from Screens1.csv.
 * Milestone id matches the lesson number inside module 1.
 */
export const BUNDLED_PAYLOAD_MILESTONE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const definitionIds = new Set<number>(DEFINITION_MILESTONE_IDS);
const bundledIds = new Set<number>(BUNDLED_PAYLOAD_MILESTONE_IDS);

export function hasShippedLesson(milestoneId: number): boolean {
  return definitionIds.has(milestoneId) || bundledIds.has(milestoneId);
}

export function bundledPayloadMilestone(
  milestoneId: number,
): { moduleNumber: number; lessonNumber: number } | undefined {
  if (bundledIds.has(milestoneId)) {
    return { moduleNumber: 1, lessonNumber: milestoneId };
  }
  return undefined;
}

/** Milestone ids the Academy map can open. Used to prebuild those lesson routes. */
export function listPlayableLessonMilestoneIds(): number[] {
  return [...definitionIds, ...bundledIds].sort((left, right) => left - right);
}

/**
 * Deploy environment used to decide the test-build unlock.
 * `publicVercelEnv` is `NEXT_PUBLIC_VERCEL_ENV` (what the browser bundle can see).
 * `vercelEnv` is `VERCEL_ENV` (server and tests). Vercel sets both itself.
 */
export type VercelDeployEnv = {
  publicVercelEnv?: string;
  vercelEnv?: string;
};

function presentDeployEnv(value: string | undefined): string | undefined {
  if (value == null || value === "") return undefined;
  return value;
}

/**
 * `NEXT_PUBLIC_VERCEL_ENV` wins when it is set, then `VERCEL_ENV`.
 * An omitted argument reads `process.env`. A passed object does not.
 */
export function readVercelDeployEnv(env?: VercelDeployEnv): string | undefined {
  if (env) {
    return (
      presentDeployEnv(env.publicVercelEnv) ?? presentDeployEnv(env.vercelEnv)
    );
  }
  return (
    presentDeployEnv(process.env.NEXT_PUBLIC_VERCEL_ENV) ??
    presentDeployEnv(process.env.VERCEL_ENV)
  );
}

/**
 * Test builds can open Explorer lessons 1–9 out of order.
 * Exact condition: the deploy env is `preview` or `development`.
 * `production`, any other string, and an unset env keep today's sequential gate.
 */
export function isExplorerPreviewLessonUnlock(env?: VercelDeployEnv): boolean {
  const deployEnv = readVercelDeployEnv(env);
  return deployEnv === "preview" || deployEnv === "development";
}

/**
 * Active (current) and completed lessons open when the lesson definition exists.
 * Do not use per-cohort `shippedCohorts` here — that was blocking the continue
 * node after lesson 2 for Maverick while the map still marked lesson 3 current.
 * Locked stays locked in production. A preview or development deploy may open a
 * locked Explorer lesson in 1–9 without writing progress. Content still falls
 * back Pathfinder → Maverick on resolve.
 */
export function canLaunchAcademyLesson(
  milestoneId: number,
  status: "active" | "completed" | "locked",
  cohort: MasteryCohort,
  env?: VercelDeployEnv,
): boolean {
  if (!hasShippedLesson(milestoneId)) {
    return false;
  }

  if (status === "active" || status === "completed") {
    return true;
  }

  return cohort === "explorer" && isExplorerPreviewLessonUnlock(env);
}

/** Dev-only: skip onboarding gates for the template lab, never for real lessons. */
export function isDevAcademyDesignShellPath(
  pathname: string | null | undefined,
): boolean {
  return isDevClient() && pathname === ACADEMY_DESIGN_SHELL_PATH;
}
