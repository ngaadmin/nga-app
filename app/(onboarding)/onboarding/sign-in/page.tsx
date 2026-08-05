import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ONBOARDING_START_PATH } from "@/lib/onboarding/guest-session";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Welcome back to NextGenAchievers.",
};

/** Legacy alias — guest access resumes via the personalization gate. */
export default function OnboardingSignInPage() {
  redirect(ONBOARDING_START_PATH);
}
