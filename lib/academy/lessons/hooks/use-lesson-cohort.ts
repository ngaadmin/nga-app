import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { useMasteryCohort } from "@/lib/dashboard/use-user-session";
import { readGhostAccessSession } from "@/lib/onboarding/ghost-session";
import { getMasteryCohortFromBirthYear } from "@/lib/dashboard/mastery-cohort";

export function getLessonMasteryCohort(
  referenceYear = new Date().getFullYear(),
): MasteryCohort {
  const session = readGhostAccessSession();
  if (!session) return "explorer";
  return getMasteryCohortFromBirthYear(session.birthYear, referenceYear);
}

export function useLessonMasteryCohort(): MasteryCohort {
  return useMasteryCohort();
}
