"use client";

import {
  AcademyLessonShell,
  LessonScreenPane,
} from "@/components/academy/lesson/academy-lesson-shell";
import { LessonHintBubble, LessonHintProvider } from "@/components/academy/lesson/lesson-hint";
import {
  LessonScreenChromeProvider,
  LessonScreenIllustration,
} from "@/components/academy/lesson/lesson-screen-chrome";
import { LessonScreenRenderer } from "@/components/academy/lesson/lesson-screen-renderer";
import { runMultipleChoiceNextHandler } from "@/components/academy/lesson/screens/multiple-choice-screen";
import { runSpotlightDecisionNextHandler } from "@/components/academy/lesson/screens/spotlight-rounds-screen";
import { runWordDropNextHandler } from "@/components/academy/lesson/screens/word-drop-screen";
import {
  lessonScreenContentOffsetClass,
  lessonScreenInlinePaddingClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { isRoomyLessonScreen } from "@/lib/academy/lessons/paired-zone-sort";
import type { LessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import {
  isDenseLessonScreen,
  resolveLessonScreenIllustration,
  supportsLessonScreenIllustration,
} from "@/lib/academy/lessons/resolve-lesson-screen-illustration";
import {
  isMultipleChoiceScreen,
  type ResolvedLessonContent,
} from "@/lib/academy/lessons/types";
import { bonusRunUnitForScreen } from "@/lib/academy/lessons/bonus-run";
import { cn } from "@/lib/utils/cn";
import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { LessonShuffleScope } from "@/components/academy/lesson/hooks/use-play-seed";
import { LessonImagePreload } from "@/components/academy/lesson/lesson-image-preload";
import { StoryAudioPlayer } from "@/components/academy/lesson/story-audio-player";
import { lessonImageSrcs } from "@/lib/academy/lessons/lesson-image-srcs";
import { nextStoryAudioSrc } from "@/lib/academy/lessons/story-audio/next-clip";
import {
  STORY_BEAT_NEXT_LOCK_MS,
  isStoryBeatScreen,
  storyBeatNextEnabled,
} from "@/lib/academy/lessons/story-audio/playback";

type LessonRunnerProps = {
  content: ResolvedLessonContent;
  flow: LessonFlow;
  awardBonusXp?: (amount: number) => void;
  onPersistentError?: (message: string) => void;
  onDismissPersistentError?: () => void;
  renderCustomScreen?: (screenIndex: number, renderer: string) => ReactNode;
  canAdvance?: boolean;
  onNext?: () => void;
  progressIndex?: number;
  progressTotal?: number;
  progressComplete?: boolean;
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
  progressIndex,
  progressTotal,
  progressComplete,
}: LessonRunnerProps) {
  const { screenIndex, markScreenReady, setBonusRunUnit } = flow;
  const activeScreen = content.screens[screenIndex];
  const isCompletionScreen = activeScreen?.type === "completion";
  const isContinueOnly =
    (activeScreen?.type === "binary-choice" || activeScreen?.type === "multiple-choice") &&
    Boolean(activeScreen.continueToLabel);
  const isSkillHub = Boolean(activeScreen && "skillHub" in activeScreen && activeScreen.skillHub);
  const isLinkMatch = activeScreen?.type === "link-match";
  const roomyScreen = isRoomyLessonScreen(activeScreen);
  const storyClip =
    activeScreen?.type === "narrative-bonus" ? activeScreen.audio : undefined;
  const storyCredit =
    activeScreen?.type === "narrative-bonus" ? activeScreen.credit : undefined;
  const storyPreload = nextStoryAudioSrc(content.screens, screenIndex);
  const imageSrcs = useMemo(
    () => lessonImageSrcs(content.screens, content.characterName),
    [content.screens, content.characterName],
  );
  const priorityImage = activeScreen
    ? resolveLessonScreenIllustration(activeScreen)?.src
    : undefined;
  const storyBeat = isStoryBeatScreen(activeScreen);
  const beatKey = storyBeat ? activeScreen?.id ?? "" : "";
  const [lockKey, setLockKey] = useState(beatKey);
  const [beatElapsedMs, setBeatElapsedMs] = useState(0);
  if (beatKey !== lockKey) {
    setLockKey(beatKey);
    setBeatElapsedMs(0);
  }

  useLayoutEffect(() => {
    if (!activeScreen || activeScreen.type === "spotlight-rounds") return;
    setBonusRunUnit(bonusRunUnitForScreen(activeScreen, screenIndex));
  }, [activeScreen, screenIndex, setBonusRunUnit]);

  useEffect(() => {
    if (!beatKey) return;
    const timer = window.setTimeout(() => {
      setBeatElapsedMs(STORY_BEAT_NEXT_LOCK_MS);
    }, STORY_BEAT_NEXT_LOCK_MS);
    return () => window.clearTimeout(timer);
  }, [beatKey]);

  useEffect(() => {
    const screen = content.screens[screenIndex];
    if (!screen) return;

    const scoredUntilCorrect =
      screen.type === "word-drop" ||
      isMultipleChoiceScreen(screen) ||
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
    <LessonShuffleScope milestoneId={content.meta.milestoneId}>
    <LessonHintProvider>
    <div className="relative flex min-h-0 flex-1 flex-col">
      <LessonImagePreload srcs={imageSrcs} prioritySrc={priorityImage} />
      <StoryAudioPlayer
        clip={storyClip}
        preloadSrc={storyPreload}
        aboveCredit={Boolean(storyCredit)}
      />
      <AcademyLessonShell
        currentScreenIndex={flow.screenIndex}
        totalScreens={content.meta.totalScreens}
        progressIndex={progressIndex}
        progressTotal={progressTotal}
        progressComplete={progressComplete}
        bonusStreak={flow.bonusStreak}
        bonusRuns={flow.bonusRuns}
        xpReward={content.rewards.xpReward}
        canAdvance={storyBeatNextEnabled({
          isStoryBeat: storyBeat,
          screenReady: canAdvance ?? (flow.canAdvanceDefault && !isCompletionScreen),
          elapsedMs: beatElapsedMs,
        })}
        onNext={
          onNext ??
          (() => {
            if (!runWordDropNextHandler()) return;
            if (!runMultipleChoiceNextHandler()) return;
            if (!runSpotlightDecisionNextHandler()) return;
            flow.handleNext();
          })
        }
        hideFooter={isCompletionScreen || isContinueOnly || isSkillHub}
        footerSlot={isCompletionScreen ? <></> : undefined}
        hideHeader={isCompletionScreen}
        matchChrome={isLinkMatch}
        skySurface={roomyScreen}
        cyanFooter={roomyScreen}
      >
        {content.screens.map((screen, index) => (
          <LessonScreenPane
            key={screen.id}
            isActive={index === flow.screenIndex}
            flush={screen.type === "completion"}
          >
            {index === flow.screenIndex ? (
              screen.type === "completion" ? (
                <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                  <LessonScreenRenderer
                    screen={screen}
                    screenIndex={index}
                    flow={flow}
                    rewards={content.rewards}
                    awardBonusXp={awardBonusXp}
                    onPersistentError={onPersistentError}
                    onDismissPersistentError={onDismissPersistentError}
                  />
                </div>
              ) : (
              <LessonScreenChromeProvider
                showIllustrationSlot={supportsLessonScreenIllustration(screen)}
                illustration={resolveLessonScreenIllustration(screen)}
                illustrationFrame={
                  screen.type === "link-match"
                    ? "match"
                    : screen.type === "allocation-slider"
                      ? "poster"
                      : screen.type === "savings-goal"
                        ? "compact"
                        : screen.type === "multiple-choice" &&
                            (screen.options?.length ?? 0) >= 3
                          ? "compact"
                          : "default"
                }
              >
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                  <div
                    className={cn(
                      "relative w-full min-w-0 shrink-0 overflow-x-hidden",
                      screen.type === "link-match"
                        ? "px-5"
                        : isRoomyLessonScreen(screen)
                          ? "lesson-screen-inline-24"
                          : lessonScreenInlinePaddingClass,
                    )}
                  >
                    <LessonScreenIllustration />
                    {screen.type === "link-match" ? null : <LessonHintBubble />}
                  </div>
                  <div
                    className={cn(
                      "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-none",
                      screen.type === "link-match"
                        ? "px-5"
                        : isRoomyLessonScreen(screen)
                          ? "lesson-screen-inline-24"
                          : lessonScreenInlinePaddingClass,
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
              )
            ) : null}
          </LessonScreenPane>
        ))}
      </AcademyLessonShell>
    </div>
    </LessonHintProvider>
    </LessonShuffleScope>
  );
}
