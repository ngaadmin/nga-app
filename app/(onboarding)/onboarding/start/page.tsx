import type { Metadata } from "next";
import { OnboardingStartClient } from "@/components/onboarding/onboarding-start-client";
import { SearchParamsBoundary } from "@/components/ui/search-params-boundary";

export const metadata: Metadata = {
  title: "Create Your Profile",
  description:
    "Pick a nickname and birth year - your 5-second personalization gate.",
};

export default function OnboardingStartPage() {
  return (
    <SearchParamsBoundary>
      <OnboardingStartClient />
    </SearchParamsBoundary>
  );
}
