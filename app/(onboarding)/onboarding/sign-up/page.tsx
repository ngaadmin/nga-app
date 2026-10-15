import type { Metadata } from "next";
import { OnboardingSignUpRedirect } from "@/components/onboarding/onboarding-sign-up-redirect";
import { SignUpForm } from "@/components/onboarding/sign-up-form";
import { SearchParamsBoundary } from "@/components/ui/search-params-boundary";

export const metadata: Metadata = {
  title: "Create Your Free Profile",
  description:
    "Create a free NextGenAchievers account and keep your streak, points, and skills safe.",
};

export default function OnboardingSignUpPage() {
  return (
    <>
      <SearchParamsBoundary>
        <OnboardingSignUpRedirect />
        <SignUpForm />
      </SearchParamsBoundary>
    </>
  );
}
