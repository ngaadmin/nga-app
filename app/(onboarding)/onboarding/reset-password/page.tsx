import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/onboarding/reset-password-form";
import { SearchParamsBoundary } from "@/components/ui/search-params-boundary";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Set a new NextGenAchievers password from your reset link.",
};

export default function OnboardingResetPasswordPage() {
  return (
    <SearchParamsBoundary>
      <ResetPasswordForm />
    </SearchParamsBoundary>
  );
}
