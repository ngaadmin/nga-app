"use client";

import { useEffect, useState } from "react";
import { readGhostAccessSession } from "@/lib/onboarding/ghost-session";

export type DashboardUserState = {
  username: string;
  isGhostMode: boolean;
  isLoading: boolean;
};

const GUEST_USERNAME = "Guest";

export function useDashboardUser(): DashboardUserState {
  const [state, setState] = useState<DashboardUserState>({
    username: GUEST_USERNAME,
    isGhostMode: false,
    isLoading: true,
  });

  useEffect(() => {
    const session = readGhostAccessSession();
    if (session) {
      setState({
        username: session.username,
        isGhostMode: session.accessMode === "ghost",
        isLoading: false,
      });
      return;
    }
    setState({
      username: GUEST_USERNAME,
      isGhostMode: false,
      isLoading: false,
    });
  }, []);

  return state;
}

export { GUEST_USERNAME };
