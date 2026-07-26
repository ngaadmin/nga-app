"use client";

import {
  lessonGameHintClass,
  lessonGiftCharacterEmojiClass,
  lessonGiftCharacterLabelClass,
  lessonGiftTapClass,
  lessonGiftTapRevealedClass,
  lessonIntroClass,
  lessonSuccessMessageClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { M1_L2_CUSTOM } from "@/lib/academy/lessons/content/m1-l2";
import type { LessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";

type M1L2CustomScreensProps = {
  renderer: string;
  screenIndex: number;
  flow: LessonFlow;
  onFlashSuccess: () => void;
};

export function M1L2CustomScreen({
  renderer,
  screenIndex,
  flow,
  onFlashSuccess,
}: M1L2CustomScreensProps) {
  if (renderer === "m1-l2-gift-reveal") {
    return (
      <GiftRevealScreen
        screenIndex={screenIndex}
        flow={flow}
        onFlashSuccess={onFlashSuccess}
      />
    );
  }

  return null;
}

function GiftRevealScreen({
  screenIndex,
  flow,
  onFlashSuccess,
}: Pick<M1L2CustomScreensProps, "screenIndex" | "flow" | "onFlashSuccess">) {
  const config = M1_L2_CUSTOM.gift;
  const [revealed, setRevealed] = useState(false);

  const handleTap = () => {
    if (revealed) return;
    setRevealed(true);
    flow.markScreenReady(screenIndex);
    onFlashSuccess();
  };

  return (
    <>
      <p className={lessonIntroClass()}>{config.intro}</p>

      <div className="mt-8 flex flex-col items-center gap-6 px-2 sm:mt-10">
        <div className="flex w-full max-w-md items-end justify-center gap-3 sm:gap-5">
          <div className="flex min-w-0 flex-1 flex-col items-center text-center">
            <span className={lessonGiftCharacterEmojiClass} aria-hidden>
              {config.characterLeft.emoji}
            </span>
            <p className={lessonGiftCharacterLabelClass}>
              {config.characterLeft.label}
            </p>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleTap();
            }}
            disabled={revealed}
            className={cn(
              lessonGiftTapClass,
              "mx-1 shrink-0",
              revealed && lessonGiftTapRevealedClass,
            )}
            aria-label="Tap gift box"
          >
            {revealed ? "🎁✨" : "🎁"}
          </button>

          <div className="flex min-w-0 flex-1 flex-col items-center text-center">
            <span className={lessonGiftCharacterEmojiClass} aria-hidden>
              {config.characterRight.emoji}
            </span>
            <p className={lessonGiftCharacterLabelClass}>
              {config.characterRight.label}
            </p>
          </div>
        </div>

        {!revealed ? (
          <p className={lessonGameHintClass}>Tap the gift to reveal</p>
        ) : (
          <div className={cn(lessonSuccessMessageClass, "w-full max-w-md")} role="status">
            {config.revealMessage}
          </div>
        )}
      </div>
    </>
  );
}
