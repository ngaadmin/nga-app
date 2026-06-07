import type { Metadata } from "next";
import { PersonalizationGateForm } from "@/components/onboarding/personalization-gate-form";

export const metadata: Metadata = {
  title: "Create Your Profile",
  description:
    "Pick a nickname and birth year — your 5-second personalization gate.",
};

export default function OnboardingStartPage() {
  return <PersonalizationGateForm />;
}
