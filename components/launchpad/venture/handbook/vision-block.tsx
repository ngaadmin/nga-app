"use client";

import type { ReactNode } from "react";
import type { LaunchpadVisionSpec } from "@/lib/launchpad/content/types";
import { summaryCatalog } from "@/lib/launchpad/content/summary";
import { compileVision, visionPieces, type VisionPiece } from "@/lib/launchpad/content/vision";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { ChosenValue } from "@/components/launchpad/venture/handbook/chosen-value";
import { AccentLabel, WORKBOOK_BODY, WORKBOOK_HINT } from "@/components/launchpad/venture/handbook/paper-art";

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
 * label, then the paragraph at the shared workbook body size, full width.
 * It does not step down. Until it can be filled: the grey italic placeholder.
 */
export function VisionBlock({
  spec,
  doodle,
}: {
  spec: LaunchpadVisionSpec;
  doodle?: ReactNode;
}) {
  const sentence = useVisionSentence(spec);
  const pieces = useVisionPieces(spec);
  return (
    <div data-vision="" data-vision-state={sentence ? "filled" : "empty"} className="w-full">
      <AccentLabel doodle={doodle}>{spec.label}</AccentLabel>
      {sentence ? (
        <div className="relative mt-3 w-full">
          <p className={`w-full whitespace-normal break-words ${WORKBOOK_BODY}`} data-vision-sentence="">
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
        <p className={`mt-2 italic ${WORKBOOK_HINT}`} data-vision-placeholder="">
          {spec.placeholder}
        </p>
      )}
    </div>
  );
}
