"use client";

import { useMemo } from "react";
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
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl bg-white px-2 py-2 shadow-sm md:min-w-[5.5rem] md:flex-none md:px-3 md:py-2.5">
      <p
        className={cn(
          "font-heading text-[10px] font-bold uppercase tracking-wide md:text-[11px]",
          toneClassName,
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-heading text-xl font-extrabold leading-none tabular-nums md:text-2xl",
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
    <article className="flex w-[6.5rem] shrink-0 snap-start flex-col items-center text-center md:w-auto md:shrink">
      <div className="relative">
        <SkillMedalVisual
          skillNumber={skill.skillNumber}
          skillName={skill.label}
          tier={skill.tier}
          size="md"
        />
        {isLocked ? (
          <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-white/90 shadow-sm">
            <LockIcon className="size-2.5 text-gray-400" />
          </span>
        ) : null}
      </div>

      <p
        className={cn(
          "mt-1.5 line-clamp-2 font-heading text-[11px] font-bold leading-tight md:mt-2 md:text-xs",
          isLocked ? "text-[#031F82]/50" : "text-[#031F82]",
        )}
      >
        {skill.label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-heading text-[10px] font-bold uppercase tracking-wide",
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
      className="flex w-full min-w-0 flex-col"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="min-w-0">
          <DashboardSectionHeading
            id="skill-awards-heading"
            className="md:text-left"
          >
            Skills
          </DashboardSectionHeading>
          <p className="mt-1 text-center font-sans text-xs font-medium text-[#031F82]/55 md:text-left">
            Locked, unlocked, then Bronze and up.
            {lockedCount > 0 ? ` ${lockedCount} still locked.` : ""}
          </p>
        </div>

        <div
          aria-label="Medal counts"
          className="flex w-full items-stretch gap-2 rounded-2xl bg-[#F7FBFF] p-1.5 md:w-auto md:min-w-[17.5rem]"
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
      </div>

      <div
        aria-label="Skills"
        className={cn(
          "mt-4 rounded-2xl bg-[#F7FBFF] px-2 py-3 md:mt-5 md:px-4 md:py-5",
          "flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth touch-pan-x",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "md:grid md:grid-cols-4 md:gap-x-3 md:gap-y-6 md:overflow-visible md:snap-none lg:grid-cols-6",
        )}
      >
        {cohortSkills.map((skill) => (
          <SkillCarouselCard key={`skill-${skill.skillNumber}`} skill={skill} />
        ))}
      </div>
    </section>
  );
}
