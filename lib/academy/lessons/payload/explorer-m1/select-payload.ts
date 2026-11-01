import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import type { LessonPayload } from "@/lib/academy/lessons/payload/types";

/**
 * Explorer uses its own payload when one is passed.
 * Maverick uses its own payload when the master workbook is on.
 * Otherwise the shared payload (Screens1.csv, or the Pathfinder master) plays.
 */
export function selectLessonPayload(
  cohort: MasteryCohort,
  bundled: LessonPayload | undefined,
  explorer: LessonPayload | undefined,
  maverick?: LessonPayload,
): LessonPayload | undefined {
  if (cohort === "explorer" && explorer) return explorer;
  if (cohort === "maverick" && maverick) return maverick;
  return bundled;
}
