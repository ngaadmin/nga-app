import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import type { LessonPayload } from "@/lib/academy/lessons/payload/types";

/**
 * Explorer Module 1 uses the converted workbook. Pathfinder and Maverick
 * stay on Screens1.csv.
 */
export function selectLessonPayload(
  cohort: MasteryCohort,
  bundled: LessonPayload | undefined,
  explorer: LessonPayload | undefined,
): LessonPayload | undefined {
  if (cohort === "explorer" && explorer) return explorer;
  return bundled;
}
