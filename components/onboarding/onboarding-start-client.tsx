"use client";

import { CohortTrackPicker } from "@/components/onboarding/cohort-track-picker";
import { OnboardingFreshStartReset } from "@/components/onboarding/onboarding-fresh-start-reset";
import { OnboardingPersonalizationFresh } from "@/components/onboarding/onboarding-personalization-fresh";
import { SearchParamsBoundary } from "@/components/ui/search-params-boundary";

/** Client orchestration for `/onboarding/start`. Avatars stay until a tap. */
export function OnboardingStartClient() {
  return (
    <>
      <SearchParamsBoundary>
        <OnboardingFreshStartReset />
        <OnboardingPersonalizationFresh />
      </SearchParamsBoundary>
      <CohortTrackPicker />
    </>
  );
}
