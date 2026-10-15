import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { useMasteryCohort } from "@/lib/dashboard/use-user-session";

export function useLessonMasteryCohort(): MasteryCohort {
  return useMasteryCohort();
}
