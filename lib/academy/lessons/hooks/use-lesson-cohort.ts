import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { useMasteryCohort } from "@/lib/dashboard/use-user-session";
import { readGuestAccessSession } from "@/lib/onboarding/guest-session";
import { getMasteryCohortFromBirthYear } from "@/lib/dashboard/mastery-cohort";

export function getLessonMasteryCohort(
  referenceYear = new Date().getFullYear(),
): MasteryCohort {
  const session = readGuestAccessSession();
  if (!session) return "explorer";
  return getMasteryCohortFromBirthYear(session.birthYear, referenceYear);
}

export function useLessonMasteryCohort(): MasteryCohort {
  return useMasteryCohort();
}
