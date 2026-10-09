import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { MASTERY_COHORT_ORDER } from "@/lib/dashboard/mastery-cohort";

/** Shipped M1 lesson ids for the design-shell jumper. Not a map unlock list. */
export const SHIPPED_DEV_LESSON_JUMP_IDS = [1, 2, 3, 4, 5] as const;

/** QA: `/dashboard/academy/lesson/4?preview=1` opens that lesson only — not a map unlock. */
export const ACADEMY_LESSON_PREVIEW_PARAM = "preview";

/** QA: `?cohort=explorer|pathfinder|maverick` on local lesson preview. */
export const ACADEMY_LESSON_PREVIEW_COHORT_PARAM = "cohort";

/** Dev/QA only — local Module 1 Lesson 5 cohort preview. Not a map unlock. */
export const M1_L5_LOCAL_PREVIEW_PATH =
  "/dashboard/academy/lesson/preview/m1-l5";

export function isAcademyLessonPreview(
  searchParams: { get(name: string): string | null } | null,
): boolean {
  return searchParams?.get(ACADEMY_LESSON_PREVIEW_PARAM) === "1";
}

export function academyLessonPreviewPath(milestoneId: number): string {
  return `/dashboard/academy/lesson/${milestoneId}?${ACADEMY_LESSON_PREVIEW_PARAM}=1`;
}

export function isMasteryCohort(value: string | null | undefined): value is MasteryCohort {
  return MASTERY_COHORT_ORDER.includes(value as MasteryCohort);
}

export function parseAcademyPreviewCohort(
  searchParams: { get(name: string): string | null } | null,
): MasteryCohort {
  const raw = searchParams?.get(ACADEMY_LESSON_PREVIEW_COHORT_PARAM)?.trim().toLowerCase();
  return isMasteryCohort(raw) ? raw : "explorer";
}

export function m1L5LocalPreviewPath(cohort: MasteryCohort = "explorer"): string {
  const params = new URLSearchParams();
  params.set(ACADEMY_LESSON_PREVIEW_COHORT_PARAM, cohort);
  return `${M1_L5_LOCAL_PREVIEW_PATH}?${params.toString()}`;
}
