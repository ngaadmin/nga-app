"use client";

import { useState } from "react";
import { GhostModeSaveModal } from "@/components/dashboard/ghost-mode-save-modal";
import { cn } from "@/lib/utils/cn";

type GhostModeBadgeProps = {
  className?: string;
  size?: "sm" | "md";
};

export function GhostModeBadge({ className, size = "md" }: GhostModeBadgeProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        aria-label="Ghost Mode — tap to save your progress with a free account"
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-[#BDE9FB]/40 font-heading font-bold text-[#031F82] transition-all hover:bg-[#BDE9FB]/60 active:scale-[0.98]",
          size === "sm" ? "px-2.5 py-1 text-[10px] sm:text-xs" : "px-3 py-1.5 text-xs sm:text-sm",
          className,
        )}
      >
        <span
          className={cn(
            "shrink-0 animate-pulse rounded-full bg-[#FFA503]",
            size === "sm" ? "size-1.5" : "size-2",
          )}
          aria-hidden
        />
        Ghost Mode (Unsaved)
      </button>

      <GhostModeSaveModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
