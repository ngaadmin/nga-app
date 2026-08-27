"use client";

import { useState } from "react";
import { LessonLinkMatchGame } from "@/components/academy/lesson/lesson-link-match-game";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import {
  LessonScreenLayout,
  lessonFeedbackCopy,
} from "@/components/academy/lesson/lesson-ui";
import type { LinkMatchScreenConfig } from "@/lib/academy/lessons/types";
import type { StandardScreenProps } from "./types";

export function LinkMatchScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<LinkMatchScreenConfig>) {
  const { showSuccess, handleComplete, handleMistake } = useLessonScreenFlow({
    screenIndex,
    flow,
  });

  const [error, setError] = useState<string | null>(null);

  return (
    <LessonScreenLayout
      intro={screen.intro}
      emphasizeInstruction={screen.emphasizeInstruction === true}
      success={showSuccess}
      errorMessage={error}
    >
      <LessonLinkMatchGame
        pairs={screen.pairs}
        eventColumnLabel={screen.eventColumnLabel}
        benefitColumnLabel={screen.benefitColumnLabel}
        onComplete={() => {
          setError(null);
          handleComplete();
        }}
        onSuccess={() => setError(null)}
        onMismatch={() => {
          setError(lessonFeedbackCopy(screen.wrongError) ?? "");
          handleMistake();
        }}
      />
    </LessonScreenLayout>
  );
}
