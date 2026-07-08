import type { Metadata } from "next";
import { Suspense } from "react";
import { PersonalizationGateForm } from "@/components/onboarding/personalization-gate-form";
import { OnboardingFreshStartReset } from "@/components/onboarding/onboarding-fresh-start-reset";
import { OnboardingSessionRedirect } from "@/components/onboarding/onboarding-session-redirect";

export const metadata: Metadata = {
  title: "Create Your Profile",
  description:
    "Pick a nickname and birth year - your 5-second personalization gate.",
};

export default function OnboardingStartPage() {
  return (
    <>
      <Suspense fallback={null}>
        <OnboardingFreshStartReset />
        <OnboardingSessionRedirect />
      </Suspense>
      <PersonalizationGateForm />
    </>
  );
}
