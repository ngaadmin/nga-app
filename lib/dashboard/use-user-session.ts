"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getComplianceTierFromBirthYear,
  resolveCurriculumCohort,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import {
  readUserSession,
  type UserSession,
} from "@/lib/onboarding/guest-session";
import { USER_SESSION_UPDATED_EVENT } from "@/lib/onboarding/user-session-events";

export function useUserSession(): UserSession | null {
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    const sync = () => setSession(readUserSession());
    sync();
    window.addEventListener(USER_SESSION_UPDATED_EVENT, sync);
    return () => window.removeEventListener(USER_SESSION_UPDATED_EVENT, sync);
  }, []);

  return session;
}

/** Learning-content cohort (curriculum override or legal default). */
export function useMasteryCohort(): MasteryCohort {
  const session = useUserSession();
  return useMemo(() => {
    if (!session) return "explorer";
    return resolveCurriculumCohort({
      birthYear: session.birthYear,
      curriculumCohort: session.curriculumCohort,
    });
  }, [session]);
}

/** Legal compliance cohort from birth year - ignores curriculum overrides. */
export function useComplianceCohort(): MasteryCohort {
  const session = useUserSession();
  return useMemo(() => {
    if (!session) return "explorer";
    return getComplianceTierFromBirthYear(session.birthYear);
  }, [session]);
}
