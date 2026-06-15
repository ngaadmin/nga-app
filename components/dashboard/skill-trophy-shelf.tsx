"use client";

import { useMemo } from "react";
import { LockIcon } from "@/lib/dashboard/icons";
import {
  sortTrophiesByTier,
  resolveVaultSkillTrophies,
  type SkillTrophyTier,
  type VaultSkillTrophy,
} from "@/lib/dashboard/skill-trophies";
import { cn } from "@/lib/utils/cn";

export type { SkillTrophyTier, VaultSkillTrophy };

function medalCoinStyles(tier: SkillTrophyTier): string {
  switch (tier) {
    case "gold":
      return cn(
        "bg-gradient-to-br from-[#FFE082] via-[#FFA503] to-[#C88202]",
        "border-b-4 border-b-[#9A5F00] shadow-[0_6px_16px_rgba(255,165,3,0.45)]",
      );
    case "silver":
      return cn(
        "bg-gradient-to-br from-[#F4F7F9] via-[#C5D0D8] to-[#8FA3B0]",
        "border-b-4 border-b-[#6B7F8C] shadow-[0_4px_12px_rgba(143,163,176,0.4)]",
      );
    case "bronze":
      return cn(
        "bg-gradient-to-br from-[#E8C4A8] via-[#CD7F32] to-[#8B5A2B]",
        "border-b-4 border-b-[#6B4423] shadow-[0_3px_10px_rgba(139,90,43,0.35)]",
      );
    case "locked":
      return "bg-gray-200 opacity-30 shadow-none";
  }
}

function tierDisplayLabel(tier: SkillTrophyTier): string {
  switch (tier) {
    case "gold":
      return "Gold";
    case "silver":
      return "Silver";
    case "bronze":
      return "Bronze";
    case "locked":
      return "Locked";
  }
}

type SkillTrophyMedalProps = {
  trophy: VaultSkillTrophy;
};

function SkillTrophyMedal({ trophy }: SkillTrophyMedalProps) {
  const isLocked = trophy.tier === "locked";

  return (
    <article className="flex w-[5.5rem] shrink-0 snap-center flex-col items-center px-1 text-center sm:w-[6rem]">
      <div className="relative">
        <div
          className={cn(
            "flex size-14 items-center justify-center rounded-full sm:size-16",
            medalCoinStyles(trophy.tier),
          )}
        >
          <span
            className={cn(
              "text-xl leading-none sm:text-2xl",
              isLocked ? "grayscale" : "drop-shadow-sm",
            )}
            aria-hidden
          >
            {trophy.medalEmoji}
          </span>
        </div>
        {isLocked ? (
          <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-white/90 shadow-sm">
            <LockIcon className="size-2.5 text-gray-400" />
          </span>
        ) : null}
      </div>

      <p
        className={cn(
          "mt-2.5 line-clamp-2 font-heading text-[9px] font-bold leading-tight",
          isLocked ? "text-[#031F82]/50" : "text-[#031F82]",
        )}
      >
        {trophy.label}
      </p>
      <p
        className={cn(
          "mt-1 font-heading text-[8px] font-bold uppercase tracking-wide",
          trophy.tier === "gold" && "text-[#FFA503]",
          trophy.tier === "silver" && "text-[#8FA3B0]",
          trophy.tier === "bronze" && "text-[#CD7F32]",
          isLocked && "text-[#031F82]/40",
        )}
      >
        {tierDisplayLabel(trophy.tier)}
      </p>
      {trophy.advancedOnly ? (
        <p className="mt-1 font-heading text-[7px] font-bold uppercase tracking-wide text-[#031F82]/40">
          15+ cohort
        </p>
      ) : null}
    </article>
  );
}

export function SkillTrophyShelf() {
  const orderedTrophies = useMemo(
    () => sortTrophiesByTier(resolveVaultSkillTrophies()),
    [],
  );

  return (
    <div
      aria-label="Financial skill medals"
      className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {orderedTrophies.map((trophy) => (
        <SkillTrophyMedal key={trophy.id} trophy={trophy} />
      ))}
    </div>
  );
}
