"use client";

import {
  AcademyLessonShell,
  LessonScreenPane,
} from "@/components/academy/lesson/academy-lesson-shell";
import { CompletionScreen } from "@/components/academy/lesson/screens/completion-screen";
import type { LessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import { explorerCompletionScreen } from "@/lib/academy/lessons/completion-screen";
import type { LessonRewards } from "@/lib/academy/lessons/types";

/** Module 1 · Lesson 1 — Explorer Screen 8 sample (not wired to lesson registry). */
const M1_L1_SCREEN_8_PREVIEW = {
  totalScreens: 8,
  screenIndex: 7,
  mistakes: 0,
  rewards: {
    skillSlug: "stop-and-think",
    achievementSkillSlug: "stop-and-think",
    xpReward: 100,
    perfectStreakBonus: 50,
  } satisfies LessonRewards,
  screen: explorerCompletionScreen("milestone-splash", "medal-skill1-unlocked"),
} as const;

const noop = () => {};

const previewFlow = {
  screenIndex: M1_L1_SCREEN_8_PREVIEW.screenIndex,
  screenMistakes: M1_L1_SCREEN_8_PREVIEW.mistakes,
  perfectStreak: true,
  progressSkillSlug: M1_L1_SCREEN_8_PREVIEW.rewards.achievementSkillSlug,
  skillMedalTier: "unlocked",
  lessonComplete: false,
  handleCashInPoints: noop,
} as Pick<
  LessonFlow,
  | "screenIndex"
  | "screenMistakes"
  | "perfectStreak"
  | "progressSkillSlug"
  | "skillMedalTier"
  | "lessonComplete"
  | "handleCashInPoints"
> as LessonFlow;

/**
 * Standalone Screen 8 preview — lesson shell chrome + completion template only.
 * Dev / QA route; does not read or write lesson progress.
 */
export function LessonCompletionScreenPreview() {
  const { totalScreens, screenIndex, mistakes, rewards, screen } =
    M1_L1_SCREEN_8_PREVIEW;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-[#FFA503]/30 bg-[#FFF7ED] px-3 py-2 text-center">
        <p className="font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-[#C88202] sm:text-xs">
          Dev preview · Module 1 · Lesson 1 · Screen 8
        </p>
      </div>

      <AcademyLessonShell
        currentScreenIndex={screenIndex}
        totalScreens={totalScreens}
        mistakes={mistakes}
        xpReward={rewards.xpReward}
        canAdvance={false}
        onNext={noop}
        hideFooter
      >
        {Array.from({ length: totalScreens }, (_, index) => (
          <LessonScreenPane key={index} isActive={index === screenIndex}>
            {index === screenIndex ? (
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
                  <CompletionScreen
                    screen={screen}
                    screenIndex={screenIndex}
                    flow={previewFlow}
                    rewards={rewards}
                  />
                </div>
              </div>
            ) : null}
          </LessonScreenPane>
        ))}
      </AcademyLessonShell>
    </div>
  );
}
