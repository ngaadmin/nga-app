/** Shipped M1 lesson ids for the design-shell jumper. Not a map unlock list. */
export const SHIPPED_DEV_LESSON_JUMP_IDS = [1, 2, 3, 4] as const;

/** QA: `/dashboard/academy/lesson/4?preview=1` opens that lesson only — not a map unlock. */
export const ACADEMY_LESSON_PREVIEW_PARAM = "preview";

export function isAcademyLessonPreview(
  searchParams: { get(name: string): string | null } | null,
): boolean {
  return searchParams?.get(ACADEMY_LESSON_PREVIEW_PARAM) === "1";
}

export function academyLessonPreviewPath(milestoneId: number): string {
  return `/dashboard/academy/lesson/${milestoneId}?${ACADEMY_LESSON_PREVIEW_PARAM}=1`;
}
