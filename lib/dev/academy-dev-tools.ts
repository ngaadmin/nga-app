import { isDevClient } from "@/lib/dev/client-persist";

/** Shipped M1 lesson ids for the design-shell jumper. Not a map unlock list. */
export const SHIPPED_DEV_LESSON_JUMP_IDS = [1, 2, 3, 4] as const;

/** Dev QA: `/dashboard/academy/lesson/4?preview=1` opens that lesson only. */
export const ACADEMY_LESSON_PREVIEW_PARAM = "preview";

export function isDevAcademyLessonPreview(
  searchParams: { get(name: string): string | null } | null,
): boolean {
  return (
    isDevClient() &&
    searchParams?.get(ACADEMY_LESSON_PREVIEW_PARAM) === "1"
  );
}

export function academyLessonPreviewPath(milestoneId: number): string {
  return `/dashboard/academy/lesson/${milestoneId}?${ACADEMY_LESSON_PREVIEW_PARAM}=1`;
}
