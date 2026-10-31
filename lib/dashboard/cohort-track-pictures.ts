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
 * One picture per track (Explorer Lars, Pathfinder Holly, Maverick Senna Older).
 * Shared by every track picker (cohort selection, sign-up age step, add profile)
 * and derived from the profile avatar defaults, so they all stay in sync.
 */
export function cohortTrackPicture(cohort: MasteryCohort): CohortTrackPicture {
  const { name, src, width, height } = profileAvatarOption(
    DEFAULT_PROFILE_AVATAR_BY_COHORT[cohort],
  );
  return { name, src, width, height };
}
