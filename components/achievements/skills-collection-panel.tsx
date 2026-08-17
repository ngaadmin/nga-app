"use client";

import { useMemo } from "react";
import { SkillMedalVisual } from "@/components/academy/skill-medal-visual";
import { LockIcon } from "@/lib/dashboard/icons";
import {
  countEarnedMedals,
  groupSkillsByProgress,
  resolveVaultSkillTrophiesForCohort,
  type SkillTrophyTier,
  type VaultSkillTrophy,
} from "@/lib/dashboard/skill-trophies";
import { useMasteryCohort } from "@/lib/dashboard/use-user-session";
import { cn } from "@/lib/utils/cn";

function MedalCountChip({
  label,
  value,
  toneClassName,
}: {
  label: string;
  value: number;
  toneClassName: string;
}) {
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
          "mt-0.5 font-heading text-xl font-extrabold leading-none tabular-nums",
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
      return "Unlocked";
    case "locked":
      return "Locked";
  }
}

function SkillTile({ skill }: { skill: VaultSkillTrophy }) {
  const isLocked = skill.tier === "locked";

  return (
    <article className="flex flex-col items-center text-center">
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
          "mt-1.5 line-clamp-2 font-heading text-[11px] font-bold leading-tight",
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
          skill.tier === "unlocked" && "text-[#031F82]",
          isLocked && "text-[#031F82]/40",
        )}
      >
        {tierDisplayLabel(skill.tier)}
      </p>
    </article>
  );
}

function SkillGroup({
  title,
  skills,
}: {
  title: string;
  skills: readonly VaultSkillTrophy[];
}) {
  if (skills.length === 0) return null;

  return (
    <section className="mt-5">
      <h3 className="font-heading text-xs font-extrabold uppercase tracking-wide text-[#0CC1E0]">
        {title}
      </h3>
      <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-5 sm:grid-cols-4">
        {skills.map((skill) => (
          <SkillTile key={skill.id} skill={skill} />
        ))}
      </div>
    </section>
  );
}

export function SkillsCollectionPanel() {
  const masteryCohort = useMasteryCohort();

  const cohortSkills = useMemo(
    () =>
      [...resolveVaultSkillTrophiesForCohort(masteryCohort)].sort(
        (a, b) => a.skillNumber - b.skillNumber,
      ),
    [masteryCohort],
  );

  const groups = useMemo(
    () => groupSkillsByProgress(cohortSkills),
    [cohortSkills],
  );

  const goldCount = countEarnedMedals(cohortSkills, "gold");
  const silverCount = countEarnedMedals(cohortSkills, "silver");
  const bronzeCount = countEarnedMedals(cohortSkills, "bronze");

  return (
    <div>
      <div
        aria-label="Medal counts"
        className="flex w-full items-stretch gap-2 rounded-2xl bg-white p-1.5 shadow-sm"
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

      <SkillGroup title="Earned" skills={groups.earned} />
      <SkillGroup title="Unlocked" skills={groups.unlocked} />
      <SkillGroup title="Locked" skills={groups.locked} />
    </div>
  );
}
