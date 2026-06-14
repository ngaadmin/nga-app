"use client";

import { useEffect, useState } from "react";
import { readGhostAccessSession } from "@/lib/onboarding/ghost-session";

export type DashboardUserState = {
  username: string;
  joinDate: string | null;
  isGhostMode: boolean;
  isLoading: boolean;
};

const GUEST_USERNAME = "Guest";

export function useDashboardUser(): DashboardUserState {
  const [state, setState] = useState<DashboardUserState>({
    username: GUEST_USERNAME,
    joinDate: null,
    isGhostMode: false,
    isLoading: true,
  });

  useEffect(() => {
    const session = readGhostAccessSession();
    if (session) {
      setState({
        username: session.username,
        joinDate: session.createdAt,
        isGhostMode: session.accessMode === "ghost",
        isLoading: false,
      });
      return;
    }
    setState({
      username: GUEST_USERNAME,
      joinDate: null,
      isGhostMode: false,
      isLoading: false,
    });
  }, []);

  return state;
}

export { GUEST_USERNAME };
