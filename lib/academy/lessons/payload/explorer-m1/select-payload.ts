import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import type { LessonPayload } from "@/lib/academy/lessons/payload/types";

/**
 * Explorer Module 1 uses the converted workbook (`lessons.json`).
 * Pathfinder and Maverick stay on Screens1.csv until stage 3.
 */
export function selectLessonPayload(
  cohort: MasteryCohort,
  bundled: LessonPayload | undefined,
  explorer: LessonPayload | undefined,
): LessonPayload | undefined {
  if (cohort === "explorer" && explorer) return explorer;
  return bundled;
}
