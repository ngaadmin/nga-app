"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ParentHubFeatureItemProps = {
  id: string;
  title: string;
  summary: string;
  isExpanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
  children: ReactNode;
};

export function ParentHubFeatureItem({
  id,
  title,
  summary,
  isExpanded,
  onToggle,
  disabled = false,
  children,
}: ParentHubFeatureItemProps) {
  return (
    // Flat: the Settings card around it is the only card (no card in a card).
    <div data-parent-hub-feature={id}>
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={isExpanded}
        aria-controls={`${id}-panel`}
        disabled={disabled}
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 py-3.5 text-left transition-colors",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "hover:bg-[#BDE9FB]/20 active:bg-[#BDE9FB]/30",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="font-heading text-[16px] font-bold text-[#031F82]">{title}</p>
          <p className="mt-0.5 font-sans text-sm leading-relaxed text-[#1E3A5F]">{summary}</p>
        </div>
        {/* The standard chevron toggle, as on the profile sections. */}
        <svg
          viewBox="0 0 12 12"
          width="14"
          height="14"
          aria-hidden
          data-parent-hub-feature-chevron
          className={cn(
            "shrink-0 text-[#0288A3] transition-transform",
            isExpanded && "rotate-180",
          )}
        >
          <path
            d="M3 4.5 6 7.5 9 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isExpanded && !disabled ? (
        <div
          id={`${id}-panel`}
          role="region"
          aria-labelledby={`${id}-trigger`}
          className="border-t border-[#BDE9FB]/60 pb-3 pt-2"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
