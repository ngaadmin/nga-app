"use client";

import type { ReactNode } from "react";
import type { LaunchpadVisionSpec } from "@/lib/launchpad/content/types";
import { summaryCatalog } from "@/lib/launchpad/content/summary";
import { compileVision } from "@/lib/launchpad/content/vision";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { AccentLabel, PAPER_ACCENT } from "@/components/launchpad/venture/handbook/paper-art";

/** The compiled vision sentence (H19) from the learner's saved answers, or null until it can be filled. */
export function useVisionSentence(spec: LaunchpadVisionSpec | undefined): string | null {
  const ctx = useLaunchpadAnswers();
  if (!spec) return null;
  return compileVision(spec, ctx?.answers, summaryCatalog(ctx?.floors ?? []));
}

/**
 * The vision slot (workbook cover and identity wrap-up): the content-driven
 * label, then a large light-blue quote mark and the paragraph in navy,
 * 17/26 semibold, full width, never cut off. Until it can be filled: the
 * grey italic placeholder, no quote mark. Read-only.
 */
export function VisionBlock({ spec, doodle }: { spec: LaunchpadVisionSpec; doodle?: ReactNode }) {
  const sentence = useVisionSentence(spec);
  return (
    <div data-vision="" data-vision-state={sentence ? "filled" : "empty"} className="w-full">
      <AccentLabel doodle={doodle}>{spec.label}</AccentLabel>
      {sentence ? (
        <div className="relative mt-3 w-full">
          <svg width="34" height="28" viewBox="0 0 44 36" fill={PAPER_ACCENT} aria-hidden="true" className="mb-1 opacity-60" data-vision-quote="">
            <path d="M4 36V22C4 10 10 3 19 1l2 5C15 8 12 13 12 18h8v18Z" />
            <path d="M26 36V22C26 10 32 3 41 1l2 5C37 8 34 13 34 18h8v18Z" />
          </svg>
          <p className="w-full whitespace-normal break-words text-[17px] font-semibold leading-[26px] text-[#19347D]" data-vision-sentence="">
            {sentence}
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
