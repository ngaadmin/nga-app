"use client";

import type { ReactNode } from "react";
import type { LaunchpadVisionSpec } from "@/lib/launchpad/content/types";
import { summaryCatalog } from "@/lib/launchpad/content/summary";
import { compileVision, visionPieces, type VisionPiece } from "@/lib/launchpad/content/vision";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { ChosenValue } from "@/components/launchpad/venture/handbook/chosen-value";
import { AccentLabel } from "@/components/launchpad/venture/handbook/paper-art";

/** The compiled vision sentence (H19) from the learner's saved answers, or null until it can be filled. */
export function useVisionSentence(spec: LaunchpadVisionSpec | undefined): string | null {
  const ctx = useLaunchpadAnswers();
  if (!spec) return null;
  return compileVision(spec, ctx?.answers, summaryCatalog(ctx?.floors ?? []));
}

function useVisionPieces(spec: LaunchpadVisionSpec | undefined): VisionPiece[] | null {
  const ctx = useLaunchpadAnswers();
  if (!spec) return null;
  return visionPieces(spec, ctx?.answers, summaryCatalog(ctx?.floors ?? []));
}

/**
 * The vision slot (workbook cover and identity wrap-up): the content-driven
 * label, then the paragraph in navy Inter 400 at 16px / 24px, full width.
 * Until it can be filled: the grey italic placeholder. Read-only.
 */
/** Page 1 vision body: Inter 400, 16px, 24px line height. It does not step down. */
export const VISION_TEXT_STEPS: readonly (readonly [px: number, lineHeight: number])[] = [[16, 24]];

export function VisionBlock({
  spec,
  doodle,
  textStep = 0,
}: {
  spec: LaunchpadVisionSpec;
  doodle?: ReactNode;
  /** Index into VISION_TEXT_STEPS (the cover steps the text down to fit). */
  textStep?: number;
}) {
  const [px, lh] = VISION_TEXT_STEPS[Math.min(textStep, VISION_TEXT_STEPS.length - 1)]!;
  const sentence = useVisionSentence(spec);
  const pieces = useVisionPieces(spec);
  return (
    <div data-vision="" data-vision-state={sentence ? "filled" : "empty"} className="w-full">
      <AccentLabel doodle={doodle}>{spec.label}</AccentLabel>
      {sentence ? (
        <div className={`relative w-full ${textStep > 2 ? "mt-2" : "mt-3"}`}>
          <p
            className="w-full whitespace-normal break-words font-sans text-[16px] font-normal text-[#19347D]"
            style={{ fontSize: px, lineHeight: `${lh}px` }}
            data-vision-sentence=""
            data-vision-step={textStep}
          >
            {pieces
              ? pieces.map((piece, index) =>
                  piece.chosen ? (
                    <ChosenValue key={index}>{piece.text}</ChosenValue>
                  ) : (
                    <span key={index}>{piece.text}</span>
                  ),
                )
              : sentence}
          </p>
        </div>
      ) : (
        <p className="mt-2 font-sans text-[16px] italic leading-[26px] text-[#4A5568]" data-vision-placeholder="">
          {spec.placeholder}
        </p>
      )}
    </div>
  );
}
