import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import {
  DEFAULT_PROFILE_AVATAR_BY_COHORT,
  profileAvatarOption,
} from "@/lib/dashboard/profile-avatar";

export type CohortTrackPicture = {
  name: string;
  src: string;
  width: number;
  height: number;
};

/**
 * The sign-up age step sizes the picture by its own box (width auto), so it
 * needs the tightly cut Senna Older file. The profile avatar uses the square
 * r1 file shared with the cohort picker and Add profile, cropped to the head.
 */
const TIGHT_MAVERICK_PICTURE = {
  src: "/assets/illustrations/characters/senna-older/senna-older-waving-512.webp",
  width: 189,
  height: 394,
} as const;

/**
 * One picture per track (Explorer Lars, Pathfinder Holly, Maverick Senna Older).
 * Used by the sign-up age step and derived from the profile avatar defaults,
 * so the characters stay in sync.
 */
export function cohortTrackPicture(cohort: MasteryCohort): CohortTrackPicture {
  const { name, src, width, height } = profileAvatarOption(
    DEFAULT_PROFILE_AVATAR_BY_COHORT[cohort],
  );
  if (cohort === "maverick") return { name, ...TIGHT_MAVERICK_PICTURE };
  return { name, src, width, height };
}
