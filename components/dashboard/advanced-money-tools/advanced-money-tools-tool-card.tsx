"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type AdvancedMoneyToolsToolCardProps = {
  title: string;
  description: string;
  tile: ReactNode;
  children?: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  expandAriaLabel: string;
};

export function AdvancedMoneyToolsToolCard({
  title,
  description,
  tile,
  children,
  isExpanded,
  onToggle,
  expandAriaLabel,
}: AdvancedMoneyToolsToolCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-[#BDE9FB] bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-label={expandAriaLabel}
        className="w-full text-left transition-colors hover:bg-[#F0FBFF]/60"
      >
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="flex w-full shrink-0 items-center justify-center sm:w-1/3">
            {tile}
          </div>
          <div className="min-w-0 flex-1 sm:w-2/3">
            <h2 className="font-heading text-base font-extrabold text-[#031F82]">{title}</h2>
            <p className="mt-1.5 font-sans text-sm leading-snug text-[#1E3A5F]/80">{description}</p>
          </div>
        </div>
      </button>

      {children ? (
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
          aria-hidden={!isExpanded}
        >
          <div
            className={cn(
              "overflow-hidden border-t border-[#BDE9FB]/60 px-4 pb-4 pt-3",
              !isExpanded && "pointer-events-none",
            )}
          >
            {children}
          </div>
        </div>
      ) : null}
    </article>
  );
}

type GrowthPotentialTileProps = {
  title: string;
  projectedAmount: string;
  subtext: string;
  className?: string;
};

export function GrowthPotentialTile({
  title,
  projectedAmount,
  subtext,
  className,
}: GrowthPotentialTileProps) {
  return (
    <div
      className={cn(
        "flex w-full max-w-[9rem] flex-col items-center rounded-xl border-2 border-[#BDE9FB] bg-[#F0FBFF]/50 px-3 py-4 text-center",
        className,
      )}
    >
      <span
        className="flex size-12 items-center justify-center rounded-full border-2 border-[#0CC1E0]/30 bg-white text-xl"
        aria-hidden
      >
        📈
      </span>
      <p className="mt-2 font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
        {title}
      </p>
      <p className="font-heading text-lg font-extrabold leading-tight tabular-nums text-[#031F82]">
        {projectedAmount}
      </p>
      <p className="mt-1 line-clamp-2 font-sans text-[11px] leading-snug text-[#1E3A5F]/70">
        {subtext}
      </p>
    </div>
  );
}

type LedgerTileProps = {
  title: string;
  subtitle: string;
  className?: string;
};

export function LedgerTile({ title, subtitle, className }: LedgerTileProps) {
  return (
    <div
      className={cn(
        "flex w-full max-w-[9rem] flex-col items-center rounded-xl border-2 border-[#BDE9FB] bg-[#F0FBFF]/50 px-3 py-4 text-center",
        className,
      )}
    >
      <span
        className="flex size-12 items-center justify-center rounded-full border-2 border-[#0CC1E0]/30 bg-white text-2xl"
        aria-hidden
      >
        📒
      </span>
      <p className="mt-2 font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
        {title}
      </p>
      <p className="font-heading text-sm font-extrabold leading-tight text-[#031F82]">
        {subtitle}
      </p>
    </div>
  );
}

type MoneyMilestonesTileProps = {
  title: string;
  className?: string;
};

export function MoneyMilestonesTile({ title, className }: MoneyMilestonesTileProps) {
  return (
    <div
      className={cn(
        "flex w-full max-w-[9rem] flex-col items-center rounded-xl border-2 border-[#BDE9FB] bg-[#F0FBFF]/50 px-3 py-4 text-center",
        className,
      )}
    >
      <span
        className="flex size-12 items-center justify-center rounded-full border-2 border-[#0CC1E0]/30 bg-white text-2xl"
        aria-hidden
      >
        🏅
      </span>
      <p className="mt-2 font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
        {title}
      </p>
      <p className="font-heading text-sm font-extrabold leading-tight text-[#031F82]">
        Wins
      </p>
    </div>
  );
}
