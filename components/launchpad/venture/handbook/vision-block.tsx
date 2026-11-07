"use client";

import type { ReactNode } from "react";
import type { LaunchpadVisionSpec } from "@/lib/launchpad/content/types";
import { summaryCatalog } from "@/lib/launchpad/content/summary";
import { compileVision, visionPieces, type VisionPiece } from "@/lib/launchpad/content/vision";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { ChosenValue } from "@/components/launchpad/venture/handbook/chosen-value";
import { AccentLabel, PAPER_ACCENT } from "@/components/launchpad/venture/handbook/paper-art";

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
 * label, then a large light-blue quote mark and the paragraph in navy,
 * 17/26 semibold, full width, never cut off. Until it can be filled: the
 * grey italic placeholder, no quote mark. Read-only.
 */
/**
 * Vision text steps for the workbook cover: start at 17/26 and step down for
 * long visions until the whole cover fits the page card with no scrolling.
 */
export const VISION_TEXT_STEPS: readonly (readonly [px: number, lineHeight: number])[] = [
  [17, 26],
  [16, 24],
  [15, 22],
  [14, 20.5],
  [13, 19],
  [12, 17.5],
  [11, 16],
];

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
          {/* Long visions: the quote mark shrinks, then floats beside the first lines. */}
          <svg
            width="34"
            height="28"
            viewBox="0 0 44 36"
            fill={PAPER_ACCENT}
            aria-hidden="true"
            className={`opacity-60 ${textStep > 2 ? "float-left mr-1.5 mt-0.5" : "mb-1"}`}
            data-vision-quote=""
            style={{ width: textStep > 2 ? 20 : 34, height: textStep > 2 ? 16 : 28 }}
          >
            <path d="M4 36V22C4 10 10 3 19 1l2 5C15 8 12 13 12 18h8v18Z" />
            <path d="M26 36V22C26 10 32 3 41 1l2 5C37 8 34 13 34 18h8v18Z" />
          </svg>
          <p
            className="w-full whitespace-normal break-words text-[#19347D]"
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
        <p className="mt-2 text-[15px] italic text-[#9AA3B5]" data-vision-placeholder="">
          {spec.placeholder}
        </p>
      )}
    </div>
  );
}
