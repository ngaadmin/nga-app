"use client";

import {
  AcademyLessonShell,
  LessonScreenPane,
} from "@/components/academy/lesson/academy-lesson-shell";
import {
  LessonScreenChromeProvider,
  LessonScreenIllustration,
} from "@/components/academy/lesson/lesson-screen-chrome";
import {
  getCompletionFooterLabel,
  LessonScreenRenderer,
} from "@/components/academy/lesson/lesson-screen-renderer";
import { lessonGoldClaimClass, lessonScreenContentOffsetClass } from "@/components/academy/lesson/lesson-shared-styles";
import type { LessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import type { ResolvedLessonContent, ScreenConfig } from "@/lib/academy/lessons/types";
import { cn } from "@/lib/utils/cn";
import { useEffect, type ReactNode } from "react";

type LessonRunnerProps = {
  content: ResolvedLessonContent;
  flow: LessonFlow;
  awardBonusXp?: (amount: number) => void;
  onPersistentError?: (message: string) => void;
  onDismissPersistentError?: () => void;
  renderCustomScreen?: (screenIndex: number, renderer: string) => ReactNode;
  canAdvance?: boolean;
  onNext?: () => void;
};

const DENSE_LESSON_SCREEN_TYPES = new Set<ScreenConfig["type"]>([
  "tap-reveal",
  "bucket-sort",
  "link-match",
  "rank-order",
  "spotlight-rounds",
  "savings-goal",
  "allocation-slider",
  "budget-select",
]);

function isDenseLessonScreen(screen: ScreenConfig): boolean {
  return DENSE_LESSON_SCREEN_TYPES.has(screen.type);
}

export function LessonRunner({
  content,
  flow,
  awardBonusXp,
  onPersistentError,
  onDismissPersistentError,
  renderCustomScreen,
  canAdvance,
  onNext,
}: LessonRunnerProps) {
  const { screenIndex, markScreenReady } = flow;
  const footerLabel = getCompletionFooterLabel(
    content.screens,
    flow.lessonComplete,
  );

  useEffect(() => {
    const screen = content.screens[screenIndex];
    if (!screen) return;

    const autoReady =
      (screen.advance?.mode === "auto-ready" &&
        screen.type !== "budget-select") ||
      (screen.type === "narrative-bonus" &&
        screen.bonusXp === 0 &&
        screen.autoReadyWhenNoBonus !== false);

    if (autoReady) {
      markScreenReady(screenIndex);
    }
  }, [content.screens, screenIndex, markScreenReady]);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col transition-shadow duration-200",
        flow.flashBorderClass,
      )}
    >
      <AcademyLessonShell
        currentScreenIndex={flow.screenIndex}
        totalScreens={content.meta.totalScreens}
        mistakes={flow.screenMistakes}
        xpReward={content.rewards.xpReward}
        canAdvance={
          canAdvance ?? (flow.canAdvanceDefault && !flow.isLastScreen)
        }
        onNext={onNext ?? (() => flow.handleNext())}
        footerSlot={
          flow.isLastScreen ? (
            <button
              type="button"
              onClick={flow.handleCashInPoints}
              disabled={flow.lessonComplete}
              className={lessonGoldClaimClass}
            >
              {footerLabel}
            </button>
          ) : undefined
        }
      >
        {content.screens.map((screen, index) => (
          <LessonScreenPane
            key={screen.id}
            isActive={index === flow.screenIndex}
          >
            {index === flow.screenIndex ? (
              <LessonScreenChromeProvider illustration={screen.illustration}>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <LessonScreenIllustration />
                  <div
                    className={cn(
                      "min-h-0 flex-1 overflow-y-auto overscroll-contain",
                      !isDenseLessonScreen(screen) && lessonScreenContentOffsetClass,
                    )}
                  >
                    {screen.type === "custom" ? (
                      renderCustomScreen?.(index, screen.renderer)
                    ) : (
                      <LessonScreenRenderer
                        screen={screen}
                        screenIndex={index}
                        flow={flow}
                        rewards={content.rewards}
                        awardBonusXp={awardBonusXp}
                        onPersistentError={onPersistentError}
                        onDismissPersistentError={onDismissPersistentError}
                      />
                    )}
                  </div>
                </div>
              </LessonScreenChromeProvider>
            ) : null}
          </LessonScreenPane>
        ))}
      </AcademyLessonShell>
    </div>
  );
}
