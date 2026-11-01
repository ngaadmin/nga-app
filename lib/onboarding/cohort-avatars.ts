import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

export type CohortAvatar = {
  src: string;
  width: number;
  height: number;
  /** Opaque figure inside the file, in source pixels. */
  figure: { x: number; y: number; width: number; height: number };
};

/**
 * Cohort faces for the age picker and the add-profile panel.
 * Both screens read this map so the files cannot drift.
 */
export const COHORT_AVATAR: Record<MasteryCohort, CohortAvatar> = {
  explorer: {
    src: "/assets/illustrations/characters/lars/lars-waving-512.webp",
    width: 191,
    height: 391,
    figure: { x: 14, y: 14, width: 163, height: 363 },
  },
  pathfinder: {
    src: "/assets/illustrations/characters/holly/holly-waving-512.webp",
    width: 199,
    height: 391,
    figure: { x: 14, y: 14, width: 171, height: 363 },
  },
  maverick: {
    src: "/assets/illustrations/characters/senna-older/senna-older-waving-r1-512.webp",
    width: 512,
    height: 512,
    figure: { x: 158, y: 130, width: 161, height: 366 },
  },
};
