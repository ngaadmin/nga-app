/** Shipped M1 lesson ids for the design-shell jumper. Not a map unlock list. */
export const SHIPPED_DEV_LESSON_JUMP_IDS = [1, 2, 3, 4, 5] as const;

/** QA: `/dashboard/academy/lesson/4?preview=1` opens that lesson only — not a map unlock. */
export const ACADEMY_LESSON_PREVIEW_PARAM = "preview";

export function isAcademyLessonPreview(
  searchParams: { get(name: string): string | null } | null,
): boolean {
  return searchParams?.get(ACADEMY_LESSON_PREVIEW_PARAM) === "1";
}

/**
 * Temporary QA bypass. Direct URLs skip the “finish the previous lesson” gate
 * in `next dev`, and whenever `?preview=1` is present. Production stays sequential.
 */
export function allowsDirectLessonOpen(options?: {
  preview?: boolean;
  nodeEnv?: string;
}): boolean {
  if (options?.preview) return true;
  return (options?.nodeEnv ?? process.env.NODE_ENV) === "development";
}

export function academyLessonPreviewPath(milestoneId: number): string {
  return `/dashboard/academy/lesson/${milestoneId}?${ACADEMY_LESSON_PREVIEW_PARAM}=1`;
}
