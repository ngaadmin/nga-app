"use client";

import { useEffect, useState } from "react";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import {
  loadParentTabAccess,
  type ParentTabAccess,
} from "@/lib/parent/parent-tab-server";

/**
 * Whether to show the Parent tab. The server decides (parent_master plus an
 * active linked child). The local session only decides whether to ask:
 * learners and guests never call the server and never see the tab.
 */
const cache = new Map<string, Promise<ParentTabAccess>>();

function accessFor(userId: string): Promise<ParentTabAccess> {
  let pending = cache.get(userId);
  if (!pending) {
    pending = loadParentTabAccess().catch(
      () => ({ eligible: false }) as ParentTabAccess,
    );
    cache.set(userId, pending);
  }
  return pending;
}

export function useParentTabAccess(): ParentTabAccess {
  const session = useUserSession();
  const userId =
    session?.accountRole === "parent_master"
      ? (session.supabaseUserId?.trim() ?? "")
      : "";
  const [access, setAccess] = useState<{
    userId: string;
    value: ParentTabAccess;
  }>({
    userId: "",
    value: { eligible: false },
  });

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void accessFor(userId).then((value) => {
      if (!cancelled) setAccess({ userId, value });
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId || access.userId !== userId) return { eligible: false };
  if (access.value.eligible && access.value.parentUserId !== userId) {
    return { eligible: false };
  }
  return access.value;
}
