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
};

/**
 * Active username / guest handle.
 * In Guest Mode the handle opens the Save Progress modal (same as Vault).
 */
export function UserHandleControl({
  className,
  size = "sm",
  username: usernameProp,
  interactive = true,
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
      />
    );
  }

  return (
    <span
      className={cn(STATUS_BANNER_ITEM_CLASS, "max-w-full truncate", className)}
      title={displayName}
    >
      <span className="truncate">{displayName}</span>
    </span>
  );
}
