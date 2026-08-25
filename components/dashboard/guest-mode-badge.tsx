"use client";

import { useState } from "react";
import { STATUS_BANNER_ITEM_CLASS } from "@/components/dashboard/status-banner-layout";
import { GuestModeSaveModal } from "@/components/dashboard/guest-mode-save-modal";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import { cn } from "@/lib/utils/cn";

type GuestModeBadgeProps = {
  className?: string;
  size?: "sm" | "md";
  /**
   * Auto-assigned guest handle / username shown as "Playing as [handle]".
   */
  label?: string;
  /** When false, renders a static label (no save-progress modal). */
  interactive?: boolean;
  /**
   * When false, hide the "Playing as …" handle and show only the save-progress
   * control (shared dashboard header).
   */
  showHandle?: boolean;
};

const SAVE_PROGRESS_LABEL = "Save your progress";

function formatPlayingAsLabel(handle?: string): string {
  const trimmed = handle?.trim();
  if (!trimmed) return "Playing as Guest";
  if (trimmed.toLowerCase().startsWith("playing as ")) return trimmed;
  return `Playing as ${trimmed}`;
}

export function GuestModeBadge({
  className,
  size = "md",
  label,
  interactive = true,
  showHandle = true,
}: GuestModeBadgeProps) {
  void size;
  const [modalOpen, setModalOpen] = useState(false);
  const displayLabel = formatPlayingAsLabel(label);
  const session = useUserSession();
  const showSaveProgressHint = interactive && session?.accessMode === "guest";
  const saveProgressText = showHandle
    ? "click here to save your progress"
    : SAVE_PROGRESS_LABEL;
  const accessibleLabel = showHandle
    ? `${displayLabel} - tap to save your progress`
    : SAVE_PROGRESS_LABEL;

  const itemClass = cn(
    STATUS_BANNER_ITEM_CLASS,
    interactive && "transition-opacity hover:opacity-70 active:opacity-55",
    className,
  );

  const inner = (
    <span className="flex min-w-0 flex-col items-center justify-center text-center">
      {showHandle ? (
        <span className="min-w-0 truncate leading-tight">{displayLabel}</span>
      ) : null}
      {showSaveProgressHint ? (
        <span className="font-bold leading-tight text-red-600">
          {saveProgressText}
        </span>
      ) : null}
    </span>
  );

  if (!interactive) {
    return (
      <span className={itemClass} title={displayLabel}>
        {inner}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        aria-label={accessibleLabel}
        className={itemClass}
      >
        {inner}
      </button>

      <GuestModeSaveModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
