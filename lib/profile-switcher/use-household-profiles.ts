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

export type HouseholdProfilesState = {
  /** True while the server lookup for this account is still in flight. */
  loading: boolean;
  /** Null when there is nothing to switch to (or still loading). */
  household: HouseholdProfiles | null;
};

/**
 * Linked profiles for the switcher, plus whether they are still loading so
 * the dropdown can show a loading row instead of falling through to the
 * Profile page. Guests and teachers never ask the server (never loading).
 */
export function useHouseholdProfilesState(): HouseholdProfilesState {
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

  if (!userId) return { loading: false, household: null };
  if (state.userId !== userId) return { loading: true, household: null };
  if (state.value && state.value.currentUserId !== userId) {
    return { loading: false, household: null };
  }
  return { loading: false, household: state.value };
}

/** Linked profiles only. Null until loaded, or when there are none. */
export function useHouseholdProfiles(): HouseholdProfiles | null {
  return useHouseholdProfilesState().household;
}
