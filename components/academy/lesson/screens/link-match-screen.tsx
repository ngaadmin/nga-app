"use client";

import { LessonLinkMatchGame } from "@/components/academy/lesson/lesson-link-match-game";
import { LessonPromptParagraphs, lessonFeedbackCopy } from "@/components/academy/lesson/lesson-ui";
import type { LinkMatchScreenConfig } from "@/lib/academy/lessons/types";
import type { StandardScreenProps } from "./types";

export function LinkMatchScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<LinkMatchScreenConfig>) {
  const hint = lessonFeedbackCopy(screen.wrongError) ?? null;

  return (
    <div className="overflow-x-hidden">
      {screen.intro ? (
        <LessonPromptParagraphs
          text={screen.intro}
          className="font-heading text-[20px] font-semibold leading-[1.35] text-[#14213D]"
        />
      ) : null}
      <LessonLinkMatchGame
        className={screen.intro ? "mt-9" : undefined}
        pairs={screen.pairs}
        orderKey={screen.id}
        eventColumnLabel={screen.eventColumnLabel}
        benefitColumnLabel={screen.benefitColumnLabel}
        hint={hint}
        onComplete={() => {
          flow.recordBonusRunCorrect();
          flow.markScreenReady(screenIndex);
        }}
        onMismatch={() => flow.incrementMistake()}
      />
    </div>
  );
}
