"use client";

import { LessonLinkMatchGame } from "@/components/academy/lesson/lesson-link-match-game";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { LessonScreenLayout } from "@/components/academy/lesson/lesson-ui";
import type { LinkMatchScreenConfig } from "@/lib/academy/lessons/types";
import type { StandardScreenProps } from "./types";

export function LinkMatchScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<LinkMatchScreenConfig>) {
  const { completeMessage, handleComplete, handleSuccess, handleMismatch } =
    useLessonScreenFlow({
      screenIndex,
      flow,
      successMessage: screen.successMessage,
    });

  return (
    <LessonScreenLayout
      intro={screen.intro}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      successMessage={completeMessage}
    >
      <LessonLinkMatchGame
        pairs={screen.pairs}
        eventColumnLabel={screen.eventColumnLabel}
        benefitColumnLabel={screen.benefitColumnLabel}
        onComplete={handleComplete}
        onSuccess={handleSuccess}
        onMismatch={handleMismatch}
      />
    </LessonScreenLayout>
  );
}
