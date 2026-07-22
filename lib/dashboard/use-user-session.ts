"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getMasteryCohortFromBirthYear,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import {
  readUserSession,
  type UserSession,
} from "@/lib/onboarding/ghost-session";
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

export function useMasteryCohort(): MasteryCohort {
  const session = useUserSession();
  return useMemo(() => {
    if (!session) return "explorer";
    return session.ageTier ?? getMasteryCohortFromBirthYear(session.birthYear);
  }, [session]);
}
