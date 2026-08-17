"use client";

import { useEffect, useState } from "react";
import { readUserSession, isGuestSession } from "@/lib/onboarding/guest-session";
import { displayAccountIdentity } from "@/lib/onboarding/registered-accounts";
import { USER_SESSION_UPDATED_EVENT } from "@/lib/onboarding/user-session-events";

export type DashboardUserState = {
  username: string;
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
      joinDate: session.createdAt,
      isGuestMode: isGuestSession(session),
      isLoading: false,
    };
  }
  return {
    username: GUEST_USERNAME,
    joinDate: null,
    isGuestMode: false,
    isLoading: false,
  };
}

export function useDashboardUser(): DashboardUserState {
  const [state, setState] = useState<DashboardUserState>({
    username: GUEST_USERNAME,
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
