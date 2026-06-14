"use client";

import { useMemo } from "react";
import { ACHIEVEMENTS_HORIZONTAL_CAROUSEL_CLASS } from "@/components/achievements/achievements-carousel";
import { DashboardSectionHeading } from "@/components/dashboard/dashboard-section-heading";
import { LockIcon } from "@/lib/dashboard/icons";
import {
  getMasteryCohortFromBirthYear,
  totalSkillsToMasterForMasteryCohort,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import {
  countEarnedMedals,
  countNotYetStartedSkills,
  skillTrophiesForMasteryCohort,
  sortTrophiesByTier,
  VAULT_SKILL_TROPHIES,
  type SkillTrophyTier,
  type VaultSkillTrophy,
} from "@/lib/dashboard/skill-trophies";
import { readGhostAccessSession } from "@/lib/onboarding/ghost-session";
import { cn } from "@/lib/utils/cn";

const floatingPanelClass = "rounded-2xl border-0 bg-white shadow-md";

type SummaryStatCardProps = {
  icon: string;
  label: string;
  value: number;
  valueClassName?: string;
};

function SummaryStatCard({
  icon,
  label,
  value,
  valueClassName,
}: SummaryStatCardProps) {
  return (
    <article
      className={cn(
        floatingPanelClass,
        "flex w-[7.5rem] shrink-0 snap-center flex-col items-center px-2 py-3 text-center sm:w-[8.5rem]",
      )}
    >
      <span
        className="flex size-10 items-center justify-center rounded-full bg-[#BDE9FB]/30 text-xl"
        aria-hidden
      >
        {icon}
      </span>
      <p className="mt-2 font-heading text-[8px] font-bold uppercase leading-tight tracking-wide text-[#0CC1E0] sm:text-[9px]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-heading text-xl font-extrabold leading-none text-[#031F82]",
          valueClassName,
        )}
      >
        {value}
      </p>
    </article>
  );
}

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

type SkillCarouselCardProps = {
  skill: VaultSkillTrophy;
};

function SkillCarouselCard({ skill }: SkillCarouselCardProps) {
  const isLocked = skill.tier === "locked";

  return (
    <article className="flex w-[5.5rem] shrink-0 snap-center flex-col items-center px-1 text-center sm:w-[6rem]">
      <div className="relative">
        <div
          className={cn(
            "flex size-14 items-center justify-center rounded-full sm:size-16",
            medalCoinStyles(skill.tier),
          )}
        >
          <span
            className={cn(
              "text-xl leading-none sm:text-2xl",
              isLocked ? "grayscale" : "drop-shadow-sm",
            )}
            aria-hidden
          >
            {skill.medalEmoji}
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
        {skill.label}
      </p>
      <p
        className={cn(
          "mt-1 font-heading text-[8px] font-bold uppercase tracking-wide",
          skill.tier === "gold" && "text-[#FFA503]",
          skill.tier === "silver" && "text-[#8FA3B0]",
          skill.tier === "bronze" && "text-[#CD7F32]",
          isLocked && "text-[#031F82]/40",
        )}
      >
        {tierDisplayLabel(skill.tier)}
      </p>
      {skill.advancedOnly ? (
        <p className="mt-1 font-heading text-[7px] font-bold uppercase tracking-wide text-[#031F82]/40">
          15+ cohort
        </p>
      ) : null}
    </article>
  );
}

function resolveMasteryCohort(): MasteryCohort {
  const session = readGhostAccessSession();
  if (session?.birthYear) {
    return getMasteryCohortFromBirthYear(session.birthYear);
  }
  return "younger";
}

export function SkillAwardsSection() {
  const masteryCohort = useMemo(() => resolveMasteryCohort(), []);

  const cohortSkills = useMemo(
    () => skillTrophiesForMasteryCohort(VAULT_SKILL_TROPHIES, masteryCohort),
    [masteryCohort],
  );

  const orderedSkills = useMemo(
    () => sortTrophiesByTier(cohortSkills),
    [cohortSkills],
  );

  const totalSkills = totalSkillsToMasterForMasteryCohort(masteryCohort);
  const goldCount = countEarnedMedals(cohortSkills, "gold");
  const silverCount = countEarnedMedals(cohortSkills, "silver");
  const bronzeCount = countEarnedMedals(cohortSkills, "bronze");
  const notStartedCount = countNotYetStartedSkills(
    VAULT_SKILL_TROPHIES,
    masteryCohort,
  );

  return (
    <section aria-labelledby="skill-awards-heading" className="w-full shrink-0">
      <DashboardSectionHeading id="skill-awards-heading">
        Your Skills
      </DashboardSectionHeading>

      <div
        aria-label="Skills summary"
        className={cn(ACHIEVEMENTS_HORIZONTAL_CAROUSEL_CLASS, "mt-4")}
      >
        <SummaryStatCard icon="🎓" label="Total Skills to Master" value={totalSkills} />
        <SummaryStatCard
          icon="🥇"
          label="Gold Medals"
          value={goldCount}
          valueClassName="text-[#FFA503]"
        />
        <SummaryStatCard
          icon="🥈"
          label="Silver Medals"
          value={silverCount}
          valueClassName="text-[#8FA3B0]"
        />
        <SummaryStatCard
          icon="🥉"
          label="Bronze Medals"
          value={bronzeCount}
          valueClassName="text-[#CD7F32]"
        />
        <SummaryStatCard
          icon="🔒"
          label="Not Yet Started"
          value={notStartedCount}
          valueClassName="text-[#031F82]/50"
        />
      </div>

      <div
        aria-label="Skills carousel"
        className={cn(ACHIEVEMENTS_HORIZONTAL_CAROUSEL_CLASS, "mt-3 gap-5")}
      >
        {orderedSkills.map((skill) => (
          <SkillCarouselCard key={skill.id} skill={skill} />
        ))}
      </div>
    </section>
  );
}
