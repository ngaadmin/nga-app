"use client";

import { useState } from "react";
import {
  STATUS_BANNER_ICON_CLASS,
  STATUS_BANNER_ITEM_CLASS,
} from "@/components/dashboard/status-banner-layout";
import { GuestModeSaveModal } from "@/components/dashboard/guest-mode-save-modal";
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
};

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
}: GuestModeBadgeProps) {
  void size;
  const [modalOpen, setModalOpen] = useState(false);
  const displayLabel = formatPlayingAsLabel(label);

  const itemClass = cn(
    STATUS_BANNER_ITEM_CLASS,
    interactive && "transition-opacity hover:opacity-70 active:opacity-55",
    className,
  );

  const inner = (
    <>
      <span
        className={cn(
          STATUS_BANNER_ICON_CLASS,
          "rounded-full bg-[#FFA503]",
          interactive ? "animate-pulse" : null,
        )}
        aria-hidden
      />
      <span className="truncate">{displayLabel}</span>
    </>
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
        aria-label={`${displayLabel} — tap to save your progress`}
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
