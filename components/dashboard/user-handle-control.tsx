"use client";

import { GuestModeBadge } from "@/components/dashboard/guest-mode-badge";
import { STATUS_BANNER_ITEM_CLASS } from "@/components/dashboard/status-banner-layout";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";
import { cn } from "@/lib/utils/cn";

type UserHandleControlProps = {
  className?: string;
  size?: "sm" | "md";
  /** Optional override — defaults to the active session username. */
  username?: string;
  /** When false, guest handle does not open the save-progress modal. */
  interactive?: boolean;
  /**
   * When false, guests see only the save-progress control (no "Playing as").
   * Registered usernames are unchanged. Defaults to true.
   */
  showGuestHandle?: boolean;
};

/**
 * Active username / guest handle.
 * Uses the same banner item classes as XP / hearts so all top-bar text shares
 * one vertical centre line.
 */
export function UserHandleControl({
  className,
  size = "sm",
  username: usernameProp,
  interactive = true,
  showGuestHandle = true,
}: UserHandleControlProps) {
  const { username, isGuestMode, isLoading } = useDashboardUser();
  const displayName = (usernameProp ?? username).trim() || "Guest";

  if (isLoading) {
    return (
      <span
        className={cn(
          STATUS_BANNER_ITEM_CLASS,
          "text-[#031F82]/60",
          className,
        )}
      >
        …
      </span>
    );
  }

  if (isGuestMode) {
    return (
      <GuestModeBadge
        className={className}
        size={size}
        label={displayName}
        interactive={interactive}
        showHandle={showGuestHandle}
      />
    );
  }

  return (
    <span
      className={cn(STATUS_BANNER_ITEM_CLASS, "max-w-full", className)}
      title={displayName}
    >
      <span className="min-w-0 truncate">{displayName}</span>
    </span>
  );
}
