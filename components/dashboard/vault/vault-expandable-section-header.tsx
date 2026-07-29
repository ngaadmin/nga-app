"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const closeButtonClass =
  "shrink-0 font-heading text-xs font-bold text-[#1E3A5F]/60 hover:text-[#031F82]";

export type VaultExpandableSectionHeaderProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  badge?: ReactNode;
  titleId?: string;
  closeLabel?: string;
  className?: string;
};

export function VaultExpandableSectionHeader({
  title,
  isOpen,
  onToggle,
  onClose,
  badge,
  titleId,
  closeLabel = "Close",
  className,
}: VaultExpandableSectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <button
        type="button"
        id={titleId}
        onClick={onToggle}
        aria-expanded={isOpen}
        className="text-left font-heading text-base font-extrabold text-[#031F82] transition-colors hover:text-[#0CC1E0]"
      >
        {title}
      </button>
      <div className="flex shrink-0 items-end gap-2">
        {badge}
        {isOpen ? (
          <button type="button" onClick={onClose} className={closeButtonClass}>
            {closeLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
