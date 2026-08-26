import {
  readPersisted,
  removePersisted,
  writePersisted,
} from "@/lib/dev/client-persist";

export const ACADEMY_FIRST_LESSON_OPENED_KEY =
  "nga_academy_first_lesson_opened" as const;

/** Matches `ACADEMY_JOURNEY_ENTRY_MILESTONE_ID` (lesson 1 on the map). */
export const FIRST_ACADEMY_LESSON_MILESTONE_ID = 1;

export function hasOpenedFirstAcademyLesson(): boolean {
  return readPersisted(ACADEMY_FIRST_LESSON_OPENED_KEY) === "1";
}

export function markFirstAcademyLessonOpened(): void {
  writePersisted(ACADEMY_FIRST_LESSON_OPENED_KEY, "1");
}

export function clearFirstAcademyLessonOpened(): void {
  removePersisted(ACADEMY_FIRST_LESSON_OPENED_KEY);
}
