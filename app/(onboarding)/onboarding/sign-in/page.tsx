import type { Metadata } from "next";
import { SignInForm } from "@/components/onboarding/sign-in-form";

export const metadata: Metadata = {
  title: "Log Back In",
  description: "Welcome back to NextGenAchievers.",
};

export default function OnboardingSignInPage() {
  return <SignInForm />;
}
