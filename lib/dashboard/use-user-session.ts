"use client";

import { useEffect, useMemo, useState } from "react";
import { type MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import {
  getSessionCurriculumCohort,
  readUserSession,
  type UserSession,
} from "@/lib/onboarding/guest-session";
import { USER_SESSION_UPDATED_EVENT } from "@/lib/onboarding/user-session-events";

/**
 * Filled after the first client read. A later mount can start from this
 * instead of painting Explorer copy for one frame. `undefined` means the
 * read has not happened yet; `null` means it happened and there is no session.
 */
let syncedSession: UserSession | null | undefined;

export function hasSyncedUserSession(): boolean {
  return syncedSession !== undefined;
}

export function useUserSession(): UserSession | null {
  const [session, setSession] = useState<UserSession | null>(() =>
    syncedSession === undefined ? null : syncedSession,
  );

  useEffect(() => {
    const sync = () => {
      const next = readUserSession();
      syncedSession = next;
      setSession(next);
    };
    sync();
    window.addEventListener(USER_SESSION_UPDATED_EVENT, sync);
    return () => window.removeEventListener(USER_SESSION_UPDATED_EVENT, sync);
  }, []);

  return session;
}

/** Learning track for the signed-in session. */
export function useMasteryCohort(): MasteryCohort {
  const session = useUserSession();
  return useMemo(() => {
    if (!session) return "explorer";
    return getSessionCurriculumCohort(session);
  }, [session]);
}
