import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { readGhostAccessSession } from "@/lib/onboarding/ghost-session";
import { getMasteryCohortFromBirthYear } from "@/lib/dashboard/mastery-cohort";
import { useMemo } from "react";

export function getLessonMasteryCohort(
  referenceYear = new Date().getFullYear(),
): MasteryCohort {
  const session = readGhostAccessSession();
  if (!session) return "explorer";
  return getMasteryCohortFromBirthYear(session.birthYear, referenceYear);
}

export function useLessonMasteryCohort(): MasteryCohort {
  return useMemo(() => getLessonMasteryCohort(), []);
}
