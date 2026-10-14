"use client";

import { useState } from "react";
import { LessonCompletionConfetti } from "@/components/academy/lesson/lesson-completion-confetti";
import { LessonSkillMedal } from "@/components/academy/lesson/lesson-skill-medal";
import {
  LESSON_CASH_IN_LABEL,
  lessonCompletionEyebrowClass,
  lessonCompletionHeaderClass,
  lessonGoldClaimClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
  resolveCompletionMedalId,
  type MedalIllustrationId,
} from "@/lib/academy/illustrations/medal-registry";
import {
  formatLessonSkillUnlockLine,
  type SkillTrophyTier,
} from "@/lib/dashboard/skill-trophies";
import { isModuleCloserLessonNumber } from "@/lib/dashboard/academy-state";
import { getSkillRegistryRecord } from "@/lib/skills/skills-registry";

type LessonCompletionPaneProps = {
  xpReward: number;
  perfectStreakBonus: number;
  perfectStreak: boolean;
  achievementSkillId: string;
  lessonNumber?: number;
  moduleNumber?: number;
  skillMedalTier: Extract<
    SkillTrophyTier,
    "unlocked" | "bronze" | "silver" | "gold"
  > | null;
  medalId?: MedalIllustrationId;
  /** Show `medalId` as authored. Lesson-number medal rules do not replace it. */
  authoredMedal?: boolean;
  /** Sheet skill name. Wins over the registry label. */
  skillName?: string;
  skillLearnedLabel?: string;
  meaningLine?: string;
  onCashIn: () => void;
  cashInDisabled?: boolean;
};

function resolveSkillName(
  skillSlug: string,
  skillLearnedLabel?: string,
): string | undefined {
  const fromRegistry = getSkillRegistryRecord(skillSlug)?.skillName?.trim();
  if (fromRegistry) return fromRegistry;

  const stripped = skillLearnedLabel
    ?.replace(/^skill\s+(unlocked|learned)\s*:?\s*/i, "")
    .trim();
  return stripped || undefined;
}

export function LessonCompletionPane({
  xpReward,
  perfectStreakBonus,
  perfectStreak,
  achievementSkillId,
  lessonNumber,
  moduleNumber,
  skillMedalTier,
  medalId,
  authoredMedal = false,
  skillName: skillNameOverride,
  skillLearnedLabel,
  meaningLine,
  onCashIn,
  cashInDisabled = false,
}: LessonCompletionPaneProps) {
  const [cashingIn, setCashingIn] = useState(false);

  const skill = getSkillRegistryRecord(achievementSkillId);
  const isModuleCloser =
    typeof lessonNumber === "number" &&
    isModuleCloserLessonNumber(lessonNumber);
  const resolvedMedalId =
    authoredMedal && medalId
      ? medalId
      : isModuleCloser
        ? undefined
        : resolveCompletionMedalId({
            medalId,
            lessonNumber,
            moduleNumber,
            skillNumber: skill?.skillNumber,
            tier: skillMedalTier,
          });
  const skillName =
    skillNameOverride?.trim() ||
    resolveSkillName(achievementSkillId, skillLearnedLabel);
  const heading = isModuleCloser
    ? "Module complete"
    : skillMedalTier === "unlocked" ||
        skillMedalTier === "bronze" ||
        skillMedalTier === "silver" ||
        skillMedalTier === "gold"
      ? formatLessonSkillUnlockLine(
          achievementSkillId,
          skillMedalTier,
          skillNameOverride,
        )
      : skillName
        ? `Skill unlocked: ${skillName}`
        : skillLearnedLabel?.trim() || "Skill unlocked";
  const shortMeaning =
    meaningLine?.trim() || skill?.description?.trim() || undefined;
  const showPerfectBonus = perfectStreak && perfectStreakBonus > 0;

  const handleCashIn = () => {
    if (cashingIn || cashInDisabled) return;
    setCashingIn(true);
    onCashIn();
  };

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      {cashingIn ? <LessonCompletionConfetti /> : null}

      <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-2 px-2 pt-1 text-center">
        {resolvedMedalId ? (
          <div className="mb-2 flex w-full justify-center">
            <LessonSkillMedal
              skillSlug={achievementSkillId}
              skillName={skillName}
              medalId={resolvedMedalId}
              size="hero"
            />
          </div>
        ) : null}

        <h2 className={lessonCompletionHeaderClass}>{heading}</h2>

        {shortMeaning ? (
          <p className={lessonCompletionEyebrowClass}>{shortMeaning}</p>
        ) : null}

        <p className="mt-2 font-heading text-[22px] font-bold tabular-nums text-[#031F82]">
          +{xpReward} points
        </p>
        {showPerfectBonus ? (
          <p className="mt-2.5 font-sans text-[15px] font-bold text-[#031F82]">
            Perfect lesson: +{perfectStreakBonus}
          </p>
        ) : null}

        <div className="mt-auto flex w-full justify-center pb-4 pt-8">
          <button
            type="button"
            onClick={handleCashIn}
            disabled={cashingIn || cashInDisabled}
            className={lessonGoldClaimClass}
          >
            {LESSON_CASH_IN_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
}
