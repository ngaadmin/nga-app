import type { Metadata } from "next";
import { PersonalizationGateForm } from "@/components/onboarding/personalization-gate-form";
import { OnboardingFreshStartReset } from "@/components/onboarding/onboarding-fresh-start-reset";
import { OnboardingPersonalizationFresh } from "@/components/onboarding/onboarding-personalization-fresh";
import { SearchParamsBoundary } from "@/components/ui/search-params-boundary";

export const metadata: Metadata = {
  title: "Create Your Profile",
  description:
    "Pick a nickname and birth year - your 5-second personalization gate.",
};

export default function OnboardingStartPage() {
  return (
    <>
      <SearchParamsBoundary>
        <OnboardingFreshStartReset />
        <OnboardingPersonalizationFresh />
      </SearchParamsBoundary>
      <PersonalizationGateForm />
    </>
  );
}
