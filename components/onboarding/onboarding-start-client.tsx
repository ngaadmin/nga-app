"use client";

import { OnboardingFreshStartReset } from "@/components/onboarding/onboarding-fresh-start-reset";
import { OnboardingPersonalizationFresh } from "@/components/onboarding/onboarding-personalization-fresh";
import { OnboardingSessionRedirect } from "@/components/onboarding/onboarding-session-redirect";
import { PersonalizationGateForm } from "@/components/onboarding/personalization-gate-form";

/** Client orchestration for `/onboarding/start` (kept for HMR / import stability). */
export function OnboardingStartClient() {
  return (
    <>
      <OnboardingFreshStartReset />
      <OnboardingPersonalizationFresh />
      <OnboardingSessionRedirect />
      <PersonalizationGateForm />
    </>
  );
}
