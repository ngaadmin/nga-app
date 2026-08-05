"use client";

import { useEffect, useState } from "react";
import { readUserSession, isGuestSession } from "@/lib/onboarding/guest-session";

export type DashboardUserState = {
  username: string;
  joinDate: string | null;
  isGuestMode: boolean;
  isLoading: boolean;
};

const GUEST_USERNAME = "Guest";

export function useDashboardUser(): DashboardUserState {
  const [state, setState] = useState<DashboardUserState>({
    username: GUEST_USERNAME,
    joinDate: null,
    isGuestMode: false,
    isLoading: true,
  });

  useEffect(() => {
    const session = readUserSession();
    if (session) {
      setState({
        username: session.username,
        joinDate: session.createdAt,
        isGuestMode: isGuestSession(session),
        isLoading: false,
      });
      return;
    }
    setState({
      username: GUEST_USERNAME,
      joinDate: null,
      isGuestMode: false,
      isLoading: false,
    });
  }, []);

  return state;
}

export { GUEST_USERNAME };
