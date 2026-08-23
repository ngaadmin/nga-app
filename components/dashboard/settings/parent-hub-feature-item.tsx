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
    <div className="overflow-hidden rounded-xl border-2 border-[#BDE9FB]/70 bg-[#F7FBFF]/40">
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={isExpanded}
        aria-controls={`${id}-panel`}
        disabled={disabled}
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "hover:bg-[#BDE9FB]/20 active:bg-[#BDE9FB]/30",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-extrabold text-[#031F82]">{title}</p>
          <p className="mt-0.5 font-sans text-sm leading-relaxed text-[#1E3A5F]">{summary}</p>
        </div>
        <span
          className={cn(
            "shrink-0 font-heading text-lg font-bold text-[#0CC1E0] transition-transform",
            isExpanded && "rotate-180",
          )}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {isExpanded && !disabled ? (
        <div
          id={`${id}-panel`}
          role="region"
          aria-labelledby={`${id}-trigger`}
          className="border-t border-[#BDE9FB]/60 px-3 pb-3 pt-2"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
