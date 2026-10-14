/** Shipped M1 lesson ids for the design-shell jumper. Not a map unlock list. */
export const SHIPPED_DEV_LESSON_JUMP_IDS = [1, 2, 3, 4, 5] as const;

/** Dev-only: `/dashboard/academy/lesson/4?preview=1` opens that lesson without writing progress. */
export const ACADEMY_LESSON_PREVIEW_PARAM = "preview";

export function isAcademyLessonPreview(
  searchParams: { get(name: string): string | null } | null,
  nodeEnv?: string,
): boolean {
  if ((nodeEnv ?? process.env.NODE_ENV) !== "development") return false;
  return searchParams?.get(ACADEMY_LESSON_PREVIEW_PARAM) === "1";
}

/**
 * Direct lesson URLs skip the “finish the previous lesson” gate in `next dev`
 * only. `?preview=1` does not open locked lessons in production.
 */
export function allowsDirectLessonOpen(options?: {
  preview?: boolean;
  nodeEnv?: string;
}): boolean {
  return (options?.nodeEnv ?? process.env.NODE_ENV) === "development";
}

export function academyLessonPreviewPath(milestoneId: number): string {
  return `/dashboard/academy/lesson/${milestoneId}?${ACADEMY_LESSON_PREVIEW_PARAM}=1`;
}
