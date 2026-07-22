"use client";

import { useCallback, useRef, useState } from "react";
import { LessonLinkMatchGame } from "@/components/academy/lesson/lesson-link-match-game";
import { lessonSuccessMessageClass } from "@/components/academy/lesson/lesson-shared-styles";
import type { LinkMatchScreenConfig } from "@/lib/academy/lessons/types";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
import type { StandardScreenProps } from "./types";

export function LinkMatchScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<LinkMatchScreenConfig>) {
  const [completeMessage, setCompleteMessage] = useState<string | null>(null);
  const flowRef = useRef(flow);
  flowRef.current = flow;

  const handleComplete = useCallback(() => {
    if (screen.successMessage) {
      setCompleteMessage(screen.successMessage);
    }
    flowRef.current.markScreenReady(screenIndex);
  }, [screen.successMessage, screenIndex]);

  const handleSuccess = useCallback(() => {
    celebrateLessonCorrectAnswer(flowRef.current.flashScreen);
  }, []);

  const handleMismatch = useCallback(() => {
    signalLessonIncorrectAnswer(flowRef.current.flashScreen);
  }, []);

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{screen.intro}</p>
      <LessonLinkMatchGame
        pairs={screen.pairs}
        eventColumnLabel={screen.eventColumnLabel}
        benefitColumnLabel={screen.benefitColumnLabel}
        onComplete={handleComplete}
        onSuccess={handleSuccess}
        onMismatch={handleMismatch}
      />
      {completeMessage ? (
        <p className={lessonSuccessMessageClass}>{completeMessage}</p>
      ) : null}
    </>
  );
}
