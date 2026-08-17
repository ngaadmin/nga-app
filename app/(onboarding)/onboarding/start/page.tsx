import type { Metadata } from "next";
import { OnboardingStartClient } from "@/components/onboarding/onboarding-start-client";
import { SearchParamsBoundary } from "@/components/ui/search-params-boundary";

export const metadata: Metadata = {
  title: "Pick Your Track",
  description:
    "Choose Explorer, Pathfinder, or Maverick and jump straight into the app.",
};

export default function OnboardingStartPage() {
  return (
    <SearchParamsBoundary>
      <OnboardingStartClient />
    </SearchParamsBoundary>
  );
}
