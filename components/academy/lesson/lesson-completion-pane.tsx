"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LessonCloseCoinCounter } from "@/components/academy/lesson/lesson-close-coin-counter";
import { LessonCompletionConfetti } from "@/components/academy/lesson/lesson-completion-confetti";
import { LessonCompletionRewardsCard } from "@/components/academy/lesson/lesson-completion-rewards-card";
import { GuestModeSaveModal } from "@/components/dashboard/guest-mode-save-modal";
import {
  LESSON_CASH_IN_LABEL,
  lessonNextButtonClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { getIllustrationPath } from "@/lib/academy/illustrations/illustration-registry";
import type { MedalIllustrationId } from "@/lib/academy/illustrations/medal-registry";
import {
  flyLessonTotalToCoinCounter,
  lessonMotionEnabled,
} from "@/lib/academy/lessons/coin-counter-flight";
import { presentedCompletionMedals } from "@/lib/academy/lessons/completion-screen";
import { quietLessonSkillLine } from "@/lib/dashboard/skill-trophies";
import type { SkillTrophyTier } from "@/lib/dashboard/skill-trophies";
import { isModuleCloserLessonNumber } from "@/lib/dashboard/academy-state";
import {
  dismissGuestSaveBanner,
  guestSaveBannerForCelebration,
  isGuestSaveBadgeTier,
  type GuestSaveBannerMoment,
} from "@/lib/onboarding/guest-save-prompt";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/guest-session";
import { getSkillRegistryRecord } from "@/lib/skills/skills-registry";
import { LAYER_CLASS } from "@/lib/ui/layers";
import { cn } from "@/lib/utils/cn";

const LARS_CELEBRATING_SRC = getIllustrationPath("lars-celebrating");

const CASH_IN_BUTTON_CLASS =
  "flex h-[52px] w-full items-center justify-center rounded-full border-0 bg-[#FFA503] px-4 text-center font-heading text-[17px] font-extrabold text-[#031F82] shadow-[0_5px_0_#C88202] transition-opacity duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#031F82] active:translate-y-[3px] active:shadow-[0_2px_0_#C88202] disabled:translate-y-0 disabled:cursor-default disabled:opacity-40 disabled:shadow-none";

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
  onCashIn: () => void;
  onContinue: () => void;
  cashInDisabled?: boolean;
  /** Balance already saved. The close screen draws its own counter. */
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
  onCashIn,
  onContinue,
  cashInDisabled = false,
  spendableXp = 0,
}: LessonCompletionPaneProps) {
  const router = useRouter();
  const [readyToCashIn, setReadyToCashIn] = useState(false);
  const [landConfetti, setLandConfetti] = useState(false);
  const [burst, setBurst] = useState(false);
  const [cashingIn, setCashingIn] = useState(false);
  const [flying, setFlying] = useState(false);
  const [cashedIn, setCashedIn] = useState(false);
  const [moment, setMoment] = useState<GuestSaveBannerMoment | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const flyingRef = useRef(false);
  const flewRef = useRef(false);
  const totalRef = useRef<HTMLParagraphElement>(null);

  const claimId = `lesson:${moduleNumber ?? 0}:${lessonNumber ?? 0}`;
  const isModuleCloser =
    typeof lessonNumber === "number" && isModuleCloserLessonNumber(lessonNumber);

  useEffect(() => {
    router.prefetch(DASHBOARD_ACADEMY_PATH);
  }, [router]);

  useEffect(() => {
    setMoment(
      guestSaveBannerForCelebration({
        claimId,
        isNewBadge: isGuestSaveBadgeTier(skillMedalTier),
        isModuleOrLevelFinish: isModuleCloser,
        moduleNumber,
        lessonNumber,
      }),
    );
  }, [claimId, isModuleCloser, lessonNumber, moduleNumber, skillMedalTier]);

  useEffect(() => {
    if (cashedIn && moment) setSaveOpen(true);
  }, [cashedIn, moment]);

  const skill = getSkillRegistryRecord(achievementSkillId);
  const medals = presentedCompletionMedals({
    lessonNumber,
    moduleNumber,
    skillNumber: skill?.skillNumber,
    skillMedalTier,
    medalId,
    authoredMedal,
    suppressMedal,
  });
  const skillName =
    skillNameOverride?.trim() ||
    resolveSkillName(achievementSkillId, skillLearnedLabel);
  const skillLine = quietLessonSkillLine(skillMedalTier, skillName);
  const medalList = medals.map((medal) => medal.medalId).join(" ");

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
    if (cashingIn || cashInDisabled || flyingRef.current || !readyToCashIn) return;
    if (lessonMotionEnabled()) {
      setLandConfetti(false);
      setBurst(true);
    }
    runAfterFlight(() => {
      setCashedIn(true);
      setCashingIn(true);
      onCashIn();
    });
  };

  const closeSavePrompt = () => {
    dismissGuestSaveBanner(claimId);
    setSaveOpen(false);
    setMoment(null);
  };

  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-[linear-gradient(180deg,#EEF7FD_0%,#FFFFFF_60%)]"
      data-lesson-close-screen=""
      data-cash-in-celebration={cashingIn ? "open" : undefined}
      data-cash-in-ready={readyToCashIn ? "true" : "false"}
      {...(medalList ? { "data-completion-medals": medalList } : {})}
    >
      {landConfetti && !burst ? <LessonCompletionConfetti light /> : null}
      {burst ? <LessonCompletionConfetti /> : null}

      <div className={cn("absolute left-6 top-3", LAYER_CLASS.chrome)}>
        <LessonCloseCoinCounter balance={spendableXp} />
      </div>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-[58px] transition-opacity duration-200",
          flying && "opacity-40",
        )}
      >
        <div className="flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LARS_CELEBRATING_SRC}
            alt="Lars celebrating"
            className="h-[120px] w-auto object-contain"
            decoding="async"
          />
          <h2 className="lesson-close-intro mt-3 text-center font-heading text-[26px] font-extrabold text-[#031F82]">
            You did it!
          </h2>
          {skillLine ? (
            <p className="lesson-close-intro mt-1 flex min-h-[23px] w-full items-center justify-center gap-1.5 text-center font-sans text-[16px] font-medium leading-none text-[#5A6A99]">
              <span className="shrink-0 text-[21px] leading-none">{skillLine.medal}</span>
              <span className="leading-[20px]">{skillLine.text}</span>
            </p>
          ) : null}
        </div>

        <LessonCompletionRewardsCard
          ref={totalRef}
          className="mt-[22px]"
          xpReward={xpReward}
          perfectStreakBonus={perfectStreakBonus}
          perfectStreak={perfectStreak}
          bonusCoins={bonusCoins}
          bonusRuns={bonusRuns}
          animate
          concealed={flying}
          cashedIn={cashedIn}
          pop={readyToCashIn && !cashedIn && !flying}
          onSettled={() => {
            setReadyToCashIn(true);
            if (lessonMotionEnabled()) setLandConfetti(true);
          }}
        />
      </div>

      <div className="shrink-0 px-6 pb-6 pt-4">
        <button
          type="button"
          onClick={cashingIn ? onContinue : handleCashIn}
          disabled={flying || (!cashingIn && (cashInDisabled || !readyToCashIn))}
          className={cashingIn ? lessonNextButtonClass : CASH_IN_BUTTON_CLASS}
        >
          {cashingIn ? "Continue" : LESSON_CASH_IN_LABEL}
        </button>
      </div>

      <GuestModeSaveModal isOpen={saveOpen} onClose={closeSavePrompt} />
    </div>
  );
}
