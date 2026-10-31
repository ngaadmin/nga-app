"use client";

import { useEffect, useState } from "react";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import type { HouseholdProfiles } from "@/lib/profile-switcher/household-profiles";
import { loadHouseholdProfiles } from "@/lib/profile-switcher/household-profiles-server";

const cache = new Map<string, Promise<HouseholdProfiles | null>>();

function householdFor(userId: string): Promise<HouseholdProfiles | null> {
  let pending = cache.get(userId);
  if (!pending) {
    pending = loadHouseholdProfiles().catch(() => null);
    cache.set(userId, pending);
  }
  return pending;
}

/**
 * Linked profiles for the switcher. Guests and teachers never ask the
 * server. Null until loaded, or when the account has no linked profiles.
 */
export function useHouseholdProfiles(): HouseholdProfiles | null {
  const session = useUserSession();
  const role = session?.accountRole;
  const userId =
    session?.accessMode === "registered" &&
    (role === "parent_master" || role === "child")
      ? (session.supabaseUserId?.trim() ?? "")
      : "";
  const [state, setState] = useState<{
    userId: string;
    value: HouseholdProfiles | null;
  }>({ userId: "", value: null });

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void householdFor(userId).then((value) => {
      if (!cancelled) setState({ userId, value });
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId || state.userId !== userId) return null;
  if (state.value && state.value.currentUserId !== userId) return null;
  return state.value;
}
