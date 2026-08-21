"use client";

import { useEffect, useState } from "react";
import { readUserSession, isGuestSession } from "@/lib/onboarding/guest-session";
import {
  displayAccountIdentity,
  resolveHouseholdEmail,
} from "@/lib/onboarding/registered-accounts";
import { USER_SESSION_UPDATED_EVENT } from "@/lib/onboarding/user-session-events";

export type DashboardUserState = {
  username: string;
  /** Parent household email. Null for learners so child email is never shown. */
  email: string | null;
  joinDate: string | null;
  isGuestMode: boolean;
  isLoading: boolean;
};

const GUEST_USERNAME = "Guest";

function readDashboardUserState(): DashboardUserState {
  const session = readUserSession();
  if (session) {
    return {
      username: displayAccountIdentity(session),
      email:
        session.accountRole === "parent_master"
          ? resolveHouseholdEmail(session)
          : null,
      joinDate: session.createdAt,
      isGuestMode: isGuestSession(session),
      isLoading: false,
    };
  }
  return {
    username: GUEST_USERNAME,
    email: null,
    joinDate: null,
    isGuestMode: false,
    isLoading: false,
  };
}

export function useDashboardUser(): DashboardUserState {
  const [state, setState] = useState<DashboardUserState>({
    username: GUEST_USERNAME,
    email: null,
    joinDate: null,
    isGuestMode: false,
    isLoading: true,
  });

  useEffect(() => {
    const sync = () => setState(readDashboardUserState());
    sync();
    window.addEventListener(USER_SESSION_UPDATED_EVENT, sync);
    return () => window.removeEventListener(USER_SESSION_UPDATED_EVENT, sync);
  }, []);

  return state;
}

export { GUEST_USERNAME };
