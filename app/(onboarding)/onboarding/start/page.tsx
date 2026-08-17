import type { Metadata } from "next";
import { OnboardingStartClient } from "@/components/onboarding/onboarding-start-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Pick Your Track",
  description:
    "Choose Explorer, Pathfinder, or Maverick and jump straight into the app.",
};

export default function OnboardingStartPage() {
  return <OnboardingStartClient />;
}
