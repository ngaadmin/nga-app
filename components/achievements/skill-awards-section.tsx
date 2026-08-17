"use client";

import { useMemo } from "react";
import { ACHIEVEMENTS_HORIZONTAL_CAROUSEL_CLASS } from "@/components/achievements/achievements-carousel";
import { SkillMedalVisual } from "@/components/academy/skill-medal-visual";
import { DashboardSectionHeading } from "@/components/dashboard/dashboard-section-heading";
import { LockIcon } from "@/lib/dashboard/icons";
import {
  countEarnedMedals,
  countNotYetStartedSkills,
  resolveVaultSkillTrophiesForCohort,
  type SkillTrophyTier,
  type VaultSkillTrophy,
} from "@/lib/dashboard/skill-trophies";
import { useMasteryCohort } from "@/lib/dashboard/use-user-session";
import { cn } from "@/lib/utils/cn";

type MedalCountChipProps = {
  label: string;
  value: number;
  toneClassName: string;
};

function MedalCountChip({ label, value, toneClassName }: MedalCountChipProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl bg-[#F7FBFF] px-2 py-2">
      <p
        className={cn(
          "font-heading text-[10px] font-bold uppercase tracking-wide",
          toneClassName,
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-heading text-lg font-extrabold leading-none tabular-nums",
          toneClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}

function tierDisplayLabel(tier: SkillTrophyTier): string {
  switch (tier) {
    case "gold":
      return "Gold";
    case "silver":
      return "Silver";
    case "bronze":
      return "Bronze";
    case "unlocked":
      return "Skill Unlocked";
    case "locked":
      return "Locked";
  }
}

type SkillCarouselCardProps = {
  skill: VaultSkillTrophy;
};

function SkillCarouselCard({ skill }: SkillCarouselCardProps) {
  const isLocked = skill.tier === "locked";
  const isUnlocked = skill.tier === "unlocked";

  return (
    <article className="flex w-[6.5rem] shrink-0 snap-start flex-col items-center px-1 text-center sm:w-[7rem]">
      <div className="relative">
        <SkillMedalVisual
          skillNumber={skill.skillNumber}
          skillName={skill.label}
          tier={skill.tier}
          size="sm"
        />
        {isLocked ? (
          <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-white/90 shadow-sm">
            <LockIcon className="size-2.5 text-gray-400" />
          </span>
        ) : null}
      </div>

      <p
        className={cn(
          "mt-2.5 line-clamp-3 font-heading text-[9px] font-bold leading-tight",
          isLocked ? "text-[#031F82]/50" : "text-[#031F82]",
        )}
      >
        {skill.label}
      </p>
      <p
        className={cn(
          "mt-1 font-heading text-[8px] font-bold uppercase tracking-wide",
          skill.tier === "gold" && "text-[#FFA503]",
          skill.tier === "silver" && "text-[#8FA3B0]",
          skill.tier === "bronze" && "text-[#CD7F32]",
          isUnlocked && "text-[#031F82]",
          isLocked && "text-[#031F82]/40",
        )}
      >
        {tierDisplayLabel(skill.tier)}
      </p>
    </article>
  );
}

export function SkillAwardsSection() {
  const masteryCohort = useMasteryCohort();

  const cohortSkills = useMemo(
    () =>
      [...resolveVaultSkillTrophiesForCohort(masteryCohort)].sort(
        (a, b) => a.skillNumber - b.skillNumber,
      ),
    [masteryCohort],
  );

  const goldCount = countEarnedMedals(cohortSkills, "gold");
  const silverCount = countEarnedMedals(cohortSkills, "silver");
  const bronzeCount = countEarnedMedals(cohortSkills, "bronze");
  const lockedCount = countNotYetStartedSkills(cohortSkills);

  return (
    <section
      aria-labelledby="skill-awards-heading"
      className="w-full min-w-0 shrink-0"
    >
      <DashboardSectionHeading id="skill-awards-heading">
        Your Skills
      </DashboardSectionHeading>

      <div
        aria-label="Medal counts"
        className="mt-3 flex w-full items-stretch gap-2"
      >
        <MedalCountChip
          label="Bronze"
          value={bronzeCount}
          toneClassName="text-[#CD7F32]"
        />
        <MedalCountChip
          label="Silver"
          value={silverCount}
          toneClassName="text-[#8FA3B0]"
        />
        <MedalCountChip
          label="Gold"
          value={goldCount}
          toneClassName="text-[#FFA503]"
        />
      </div>
      {lockedCount > 0 ? (
        <p className="mt-2 text-center font-sans text-xs font-medium text-[#031F82]/45">
          {lockedCount} still locked
        </p>
      ) : null}

      <div
        aria-label="Skills carousel"
        className={cn(
          ACHIEVEMENTS_HORIZONTAL_CAROUSEL_CLASS,
          "mt-3 gap-4 touch-pan-x",
        )}
      >
        {cohortSkills.map((skill) => (
          <SkillCarouselCard key={`skill-${skill.skillNumber}`} skill={skill} />
        ))}
      </div>
    </section>
  );
}
