import type { Metadata } from "next";
import { PersonalizationGateForm } from "@/components/onboarding/personalization-gate-form";
import { OnboardingSessionRedirect } from "@/components/onboarding/onboarding-session-redirect";

export const metadata: Metadata = {
  title: "Create Your Profile",
  description:
    "Pick a nickname and birth year — your 5-second personalization gate.",
};

export default function OnboardingStartPage() {
  return (
    <>
      <OnboardingSessionRedirect />
      <PersonalizationGateForm />
    </>
  );
}
