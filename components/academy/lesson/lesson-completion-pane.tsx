"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LessonCompletionConfetti } from "@/components/academy/lesson/lesson-completion-confetti";
import { LessonCompletionRewardsCard } from "@/components/academy/lesson/lesson-completion-rewards-card";
import { GuestSavePromptBanner } from "@/components/onboarding/guest-save-prompt-banner";
import { LessonSkillMedal } from "@/components/academy/lesson/lesson-skill-medal";
import {
  flyLessonTotalToCoinCounter,
  lessonMotionEnabled,
} from "@/lib/academy/lessons/coin-counter-flight";
import { coinWord } from "@/lib/copy/coin-word";
import {
  LESSON_CASH_IN_LABEL,
  lessonCompletionEyebrowClass,
  lessonCompletionHeaderClass,
  lessonGoldClaimClass,
  lessonNextButtonClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { presentedCompletionMedals } from "@/lib/academy/lessons/completion-screen";
import type { MedalIllustrationId } from "@/lib/academy/illustrations/medal-registry";
import {
  formatLessonSkillUnlockLine,
  type SkillTrophyTier,
} from "@/lib/dashboard/skill-trophies";
import { isModuleCloserLessonNumber } from "@/lib/dashboard/academy-state";
import { isGuestSaveBadgeTier } from "@/lib/onboarding/guest-save-prompt";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/guest-session";
import { getSkillRegistryRecord } from "@/lib/skills/skills-registry";

type LessonCompletionPaneProps = {
  xpReward: number;
  perfectStreakBonus: number;
  perfectStreak: boolean;
  bonusCoins?: number;
  bonusRuns?: number;
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
  /** `MEDAL: none`. Do not fill in a lesson-number medal. */
  suppressMedal?: boolean;
  /** Sheet skill name. Wins over the registry label. */
  skillName?: string;
  skillLearnedLabel?: string;
  meaningLine?: string;
  onCashIn: () => void;
  onContinue: () => void;
  cashInDisabled?: boolean;
  /** XP still available to cash in for Vault cash. */
  spendableXp?: number;
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
  bonusCoins = 0,
  bonusRuns = 0,
  achievementSkillId,
  lessonNumber,
  moduleNumber,
  skillMedalTier,
  medalId,
  authoredMedal = false,
  suppressMedal = false,
  skillName: skillNameOverride,
  skillLearnedLabel,
  meaningLine,
  onCashIn,
  onContinue,
  cashInDisabled = false,
  spendableXp,
}: LessonCompletionPaneProps) {
  const router = useRouter();
  const [cashingIn, setCashingIn] = useState(false);
  const [flying, setFlying] = useState(false);
  const flyingRef = useRef(false);
  const flewRef = useRef(false);
  const totalRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    router.prefetch(DASHBOARD_ACADEMY_PATH);
  }, [router]);

  const skill = getSkillRegistryRecord(achievementSkillId);
  const isModuleCloser =
    typeof lessonNumber === "number" &&
    isModuleCloserLessonNumber(lessonNumber);
  const medals = presentedCompletionMedals({
    lessonNumber,
    moduleNumber,
    skillNumber: skill?.skillNumber,
    skillMedalTier,
    medalId,
    authoredMedal,
    suppressMedal,
  });
  const goldMedals = medals.length > 1 ? medals : [];
  const resolvedMedalId = medals.length === 1 ? medals[0]?.medalId : undefined;
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
  const runAfterFlight = (action: () => void) => {
    if (flyingRef.current) return;
    const node = totalRef.current;
    if (!node || flewRef.current || !lessonMotionEnabled()) {
      action();
      return;
    }
    flyingRef.current = true;
    flewRef.current = true;
    setFlying(true);
    flyLessonTotalToCoinCounter(
      node,
      node.dataset.rewardLabel || node.textContent || "",
      () => {
        flyingRef.current = false;
        setFlying(false);
        action();
      },
    );
  };

  const handleCashIn = () => {
    if (cashingIn || cashInDisabled || flyingRef.current) return;
    runAfterFlight(() => {
      setCashingIn(true);
      onCashIn();
    });
  };

  return (
    <div
      className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden"
      data-cash-in-celebration={cashingIn ? "open" : undefined}
    >
      {cashingIn ? (
        <LessonCompletionConfetti />
      ) : null}

      <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-2 px-2 pt-1 text-center">
        {goldMedals.length > 0 ? (
          <div className="mb-2 flex w-full items-end justify-center gap-1">
            {goldMedals.map((medal) => (
              <LessonSkillMedal
                key={medal.medalId}
                skillSlug={medal.skillSlug ?? achievementSkillId}
                medalId={medal.medalId}
                size="row"
              />
            ))}
          </div>
        ) : resolvedMedalId ? (
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

        <LessonCompletionRewardsCard
          ref={totalRef}
          xpReward={xpReward}
          perfectStreakBonus={perfectStreakBonus}
          perfectStreak={perfectStreak}
          bonusCoins={bonusCoins}
          bonusRuns={bonusRuns}
          animate
        />
        {typeof spendableXp === "number" ? (
          <p className="mt-2 font-sans text-[15px] font-bold text-[#031F82]">
            {spendableXp.toLocaleString()} {coinWord(spendableXp)} to cash in
          </p>
        ) : null}

        <GuestSavePromptBanner
          claimId={`lesson:${moduleNumber ?? 0}:${lessonNumber ?? 0}`}
          isNewBadge={isGuestSaveBadgeTier(skillMedalTier)}
          isModuleOrLevelFinish={isModuleCloser}
          moduleNumber={moduleNumber}
          lessonNumber={lessonNumber}
          className="mt-4 w-full text-left"
        />

        <div className="mt-auto flex w-full justify-center pb-4 pt-8">
          <button
            type="button"
            onClick={
              cashingIn
                ? () => {
                    if (flyingRef.current) return;
                    runAfterFlight(onContinue);
                  }
                : handleCashIn
            }
            disabled={flying || (!cashingIn && cashInDisabled)}
            className={cashingIn ? lessonNextButtonClass : lessonGoldClaimClass}
          >
            {cashingIn ? "Continue" : LESSON_CASH_IN_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
}
