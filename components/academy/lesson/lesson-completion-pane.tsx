"use client";

import { useAcademyMediaSrc } from "@/lib/academy/media/academy-media-context";
import { reportAcademyMediaFailed } from "@/lib/academy/media/media-failure-client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LessonCloseCoinCounter } from "@/components/academy/lesson/lesson-close-coin-counter";
import { LessonSkillMedal } from "@/components/academy/lesson/lesson-skill-medal";
import { LessonCompletionConfetti } from "@/components/academy/lesson/lesson-completion-confetti";
import { LessonCompletionRewardsCard } from "@/components/academy/lesson/lesson-completion-rewards-card";
import { GuestModeSaveModal } from "@/components/dashboard/guest-mode-save-modal";
import {
  LESSON_CASH_IN_LABEL,
  LESSON_CASH_IN_RETRY_LABEL,
  lessonNextButtonClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import type { LessonCashInOutcome } from "@/lib/academy/lessons/lesson-coin-commit";
import {
  getIllustrationPath,
  isIllustrationId,
} from "@/lib/academy/illustrations/illustration-registry";
import type { MedalIllustrationId } from "@/lib/academy/illustrations/medal-registry";
import {
  flyLessonTotalToCoinCounter,
  lessonMotionEnabled,
} from "@/lib/academy/lessons/coin-counter-flight";
import {
  moduleCloserGoldSkillLine,
  presentedCompletionMedals,
} from "@/lib/academy/lessons/completion-screen";
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

function celebratingPortrait(name?: string): { src: string; alt: string } {
  const trimmed = name?.trim();
  const id = trimmed ? `${trimmed.toLowerCase()}-celebrating` : "";
  if (id && isIllustrationId(id)) {
    return {
      src: getIllustrationPath(id),
      alt: `${trimmed} celebrating`,
    };
  }
  return {
    src: getIllustrationPath("lars-celebrating"),
    alt: "Lars celebrating",
  };
}

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
  /** `-app` file named on the sheet. The medal id stays without that suffix. */
  medalSrc?: string;
  /** Show `medalId` as authored. Lesson-number medal rules do not replace it. */
  authoredMedal?: boolean;
  /** `MEDAL: none`. Do not fill in a lesson-number medal. */
  suppressMedal?: boolean;
  /** Sheet skill name. Wins over the registry label. */
  skillName?: string;
  /** Cohort lead from Lesson-Details. Their celebrating pose replaces the default portrait. */
  leadCharacter?: string;
  skillLearnedLabel?: string;
  onCashIn: () =>
    | void
    | LessonCashInOutcome
    | Promise<void | LessonCashInOutcome | undefined>;
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
  medalSrc,
  authoredMedal = false,
  suppressMedal = false,
  skillName: skillNameOverride,
  leadCharacter,
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
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [flying, setFlying] = useState(false);
  const [portraitFailed, setPortraitFailed] = useState(false);
  const [cashedIn, setCashedIn] = useState(false);
  const [moment, setMoment] = useState<GuestSaveBannerMoment | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const flyingRef = useRef(false);
  const flewRef = useRef(false);
  const savingRef = useRef(false);
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
  const closerLine = isModuleCloser
    ? moduleCloserGoldSkillLine(moduleNumber ?? 1)
    : null;
  const skillLine = closerLine ?? quietLessonSkillLine(skillMedalTier, skillName);
  const localPortrait = celebratingPortrait(leadCharacter);
  const portraitSrc = useAcademyMediaSrc(localPortrait.src);
  const portrait = { ...localPortrait, src: portraitSrc };
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

  const finishCashIn = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveFailed(false);
    try {
      const result = await onCashIn();
      if (result && result.ok === false) {
        setSaveFailed(true);
        return;
      }
      setCashedIn(true);
      setCashingIn(true);
    } catch {
      setSaveFailed(true);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleCashIn = () => {
    if (
      savingRef.current ||
      cashingIn ||
      cashInDisabled ||
      flyingRef.current ||
      !readyToCashIn
    ) {
      return;
    }
    setSaveFailed(false);
    if (lessonMotionEnabled()) {
      setLandConfetti(false);
      setBurst(true);
    }
    runAfterFlight(() => {
      void finishCashIn();
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
          {portraitFailed ? (
            <span
              className="flex h-[120px] w-[120px] items-center justify-center rounded-2xl border-2 border-dashed border-[#B9C7EA] bg-[#F4F7FF]"
              data-testid="academy-media-placeholder"
              aria-hidden
            >
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#8FA3D6" strokeWidth="1.6">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="10" r="1.6" />
                <path d="M4 17l5-5 4 4 3-3 4 4" />
              </svg>
            </span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={portrait.src}
              alt={portrait.alt}
              className="h-[120px] w-auto object-contain"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onError={() => {
                setPortraitFailed(true);
                reportAcademyMediaFailed(portrait.src, "image");
              }}
            />
          )}
          <h2 className="lesson-close-intro mt-3 text-center font-heading text-[26px] font-extrabold text-[#031F82]">
            You did it!
          </h2>
          {skillLine ? (
            <p className="lesson-close-intro mt-1 flex min-h-[23px] w-full items-center justify-center gap-1.5 text-center font-sans text-[16px] font-medium leading-none text-[#5A6A99]">
              <span className="shrink-0 text-[21px] leading-none">{skillLine.medal}</span>
              <span className={cn("leading-[20px]", closerLine && "text-center leading-snug")}>
                {skillLine.text}
              </span>
            </p>
          ) : null}
          {medals[0] ? (
            <LessonSkillMedal
              className="mt-3"
              skillSlug={medals[0].skillSlug ?? achievementSkillId}
              medalId={medals[0].medalId}
              src={medalId === medals[0].medalId ? medalSrc : undefined}
              skillName={skillName}
              size="hero"
            />
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
        {saveFailed ? (
          <p
            role="status"
            data-cash-in-error=""
            className="mb-2 text-center font-sans text-[13px] font-semibold text-[#031F82]"
          >
            {LESSON_CASH_IN_RETRY_LABEL}
          </p>
        ) : null}
        {saveFailed ? (
          <button
            type="button"
            onClick={() => router.push(DASHBOARD_ACADEMY_PATH)}
            className={`${lessonNextButtonClass} mb-2`}
          >
            Back to map
          </button>
        ) : null}
        <button
          type="button"
          onClick={cashingIn ? onContinue : handleCashIn}
          disabled={
            flying ||
            saving ||
            (!cashingIn && (cashInDisabled || !readyToCashIn))
          }
          className={cashingIn ? lessonNextButtonClass : CASH_IN_BUTTON_CLASS}
        >
          {cashingIn ? "Continue" : LESSON_CASH_IN_LABEL}
        </button>
      </div>

      <GuestModeSaveModal isOpen={saveOpen} onClose={closeSavePrompt} />
    </div>
  );
}
