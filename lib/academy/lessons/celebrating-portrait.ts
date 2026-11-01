import {
  getIllustrationPath,
  getPairSheetImagePath,
  isIllustrationId,
} from "@/lib/academy/illustrations/illustration-registry";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

/**
 * Cohort cast that shares a Lesson-Details name with another cohort.
 * Maverick's Senna is the older Senna, so the close screen must not show the
 * Explorer Senna.
 */
const COHORT_CELEBRATING_FILES: Partial<Record<MasteryCohort, Record<string, string>>> = {
  maverick: { senna: "senna-older-celebrating-r1-512.webp" },
};

/** The lead's celebrating pose for this cohort, under /public. Lars when there is none. */
export function celebratingPortraitSrc(leadName?: string, cohort?: MasteryCohort): string {
  const trimmed = leadName?.trim().toLowerCase() ?? "";
  const cohortFile = cohort && trimmed ? COHORT_CELEBRATING_FILES[cohort]?.[trimmed] : undefined;
  if (cohortFile) {
    const src = getPairSheetImagePath(cohortFile);
    if (src) return src;
  }
  const id = trimmed ? `${trimmed}-celebrating` : "";
  if (id && isIllustrationId(id)) return getIllustrationPath(id);
  return getIllustrationPath("lars-celebrating");
}
