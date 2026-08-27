"use client";

import {
  AcademyLessonShell,
  LessonScreenPane,
} from "@/components/academy/lesson/academy-lesson-shell";
import {
  LessonScreenChromeProvider,
  LessonScreenIllustration,
} from "@/components/academy/lesson/lesson-screen-chrome";
import { LessonScreenRenderer } from "@/components/academy/lesson/lesson-screen-renderer";
import { runBinaryChoiceNextHandler } from "@/components/academy/lesson/screens/binary-choice-screen";
import { runWordDropNextHandler } from "@/components/academy/lesson/screens/word-drop-screen";
import { lessonScreenContentOffsetClass } from "@/components/academy/lesson/lesson-shared-styles";
import type { LessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import {
  isDenseLessonScreen,
  resolveLessonScreenIllustration,
  supportsLessonScreenIllustration,
} from "@/lib/academy/lessons/resolve-lesson-screen-illustration";
import type { ResolvedLessonContent } from "@/lib/academy/lessons/types";
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
  const isCompletionScreen =
    content.screens[screenIndex]?.type === "completion";

  useEffect(() => {
    const screen = content.screens[screenIndex];
    if (!screen) return;

    const scoredUntilCorrect =
      screen.type === "word-drop" ||
      screen.type === "binary-choice" ||
      screen.type === "true-false";

    const autoReady =
      (screen.advance?.mode === "auto-ready" &&
        screen.type !== "budget-select" &&
        screen.type !== "tap-reveal" &&
        screen.type !== "bucket-sort" &&
        !scoredUntilCorrect) ||
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
          canAdvance ?? (flow.canAdvanceDefault && !isCompletionScreen)
        }
        onNext={
          onNext ??
          (() => {
            if (!runWordDropNextHandler()) return;
            if (!runBinaryChoiceNextHandler()) return;
            flow.handleNext();
          })
        }
        hideFooter={isCompletionScreen}
        footerSlot={isCompletionScreen ? <></> : undefined}
      >
        {content.screens.map((screen, index) => (
          <LessonScreenPane
            key={screen.id}
            isActive={index === flow.screenIndex}
          >
            {index === flow.screenIndex ? (
              <LessonScreenChromeProvider
                showIllustrationSlot={supportsLessonScreenIllustration(screen)}
                illustration={resolveLessonScreenIllustration(screen)}
              >
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                  <div className="w-full min-w-0 shrink-0">
                    <LessonScreenIllustration />
                  </div>
                  <div
                    className={cn(
                      "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain",
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
