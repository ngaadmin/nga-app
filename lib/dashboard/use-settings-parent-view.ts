"use client";

import { useUserSession } from "@/lib/dashboard/use-user-session";

/** Parent Settings controls. A child account never sees them. */
export function useSettingsParentView(): boolean {
  const session = useUserSession();
  return session?.accountRole === "parent_master";
}
