"use client";

import { OnboardingFreshStartReset } from "@/components/onboarding/onboarding-fresh-start-reset";
import { OnboardingPersonalizationFresh } from "@/components/onboarding/onboarding-personalization-fresh";
import { CohortTrackPicker } from "@/components/onboarding/cohort-track-picker";

/** Client orchestration for `/onboarding/start`. */
export function OnboardingStartClient() {
  return (
    <>
      <OnboardingFreshStartReset />
      <OnboardingPersonalizationFresh />
      <CohortTrackPicker />
    </>
  );
}
