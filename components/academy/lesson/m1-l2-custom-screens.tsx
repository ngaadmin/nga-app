"use client";

import {
  lessonGiftTapClass,
  lessonGiftTapRevealedClass,
  lessonIntroClass,
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
      <div className="mt-6 flex items-end justify-between gap-2 px-2">
        <div className="text-center">
          <p className="text-4xl" aria-hidden>
            {config.characterLeft.emoji}
          </p>
          <p className="mt-1 font-heading text-sm font-bold text-[#031F82]">
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
            revealed && lessonGiftTapRevealedClass,
          )}
          aria-label="Tap gift box"
        >
          {revealed ? "🎁✨" : "🎁"}
        </button>
        <div className="text-center">
          <p className="text-4xl" aria-hidden>
            {config.characterRight.emoji}
          </p>
          <p className="mt-1 font-heading text-sm font-bold text-[#031F82]">
            {config.characterRight.label}
          </p>
        </div>
      </div>
      {revealed ? (
        <div className="mt-5 rounded-xl border border-[#22C55E]/40 bg-[#DCFCE7] px-4 py-4 shadow-md">
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            {config.revealMessage}
          </p>
        </div>
      ) : null}
    </>
  );
}
