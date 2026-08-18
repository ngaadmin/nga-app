import type { Metadata } from "next";
import { SignInForm } from "@/components/onboarding/sign-in-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to NextGenAchievers.",
};

export default function OnboardingSignInPage() {
  return <SignInForm />;
}
