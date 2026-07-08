"use client";

import {
  AcademyLessonShell,
  LessonScreenPane,
} from "@/components/academy/lesson/academy-lesson-shell";
import {
  getCompletionFooterLabel,
  LessonScreenRenderer,
} from "@/components/academy/lesson/lesson-screen-renderer";
import { lessonGoldClaimClass } from "@/components/academy/lesson/lesson-shared-styles";
import type { LessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
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
  const footerLabel = getCompletionFooterLabel(
    content.screens,
    flow.lessonComplete,
  );

  useEffect(() => {
    const screen = content.screens[flow.screenIndex];
    if (!screen) return;

    const autoReady =
      screen.advance?.mode === "auto-ready" ||
      (screen.type === "narrative-bonus" &&
        screen.bonusXp === 0 &&
        screen.autoReadyWhenNoBonus !== false);

    if (autoReady) {
      flow.markScreenReady(flow.screenIndex);
    }
  }, [content.screens, flow.screenIndex, flow.markScreenReady]);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col transition-shadow duration-200",
        flow.flashBorderClass,
      )}
    >
      <AcademyLessonShell
        lessonLabel={content.meta.shellLabel}
        currentScreenIndex={flow.screenIndex}
        totalScreens={content.meta.totalScreens}
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
              screen.type === "custom" ? (
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
              )
            ) : null}
          </LessonScreenPane>
        ))}
      </AcademyLessonShell>
    </div>
  );
}
