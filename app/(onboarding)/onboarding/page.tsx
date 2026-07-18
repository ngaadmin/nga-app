import type { Metadata } from "next";
import { OnboardingEntryGate } from "@/components/onboarding";

export const metadata: Metadata = {
  title: "Get Started",
  description:
    "Join NextGenAchievers - the free, fun way to master real-world money skills.",
};

export default function OnboardingPage() {
  return <OnboardingEntryGate />;
}
