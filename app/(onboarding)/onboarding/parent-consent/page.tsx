import type { Metadata } from "next";
import Link from "next/link";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";

export const metadata: Metadata = {
  title: "Parent Consent",
  description: "Parent or guardian consent for Explorers under 13.",
};

export default function ParentConsentPage() {
  return (
    <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md space-y-8 px-1">
        <OnboardingProgress value={50} />

        <div className="space-y-3 text-center">
          <h1 className="font-heading text-2xl font-extrabold text-nga-primary">
            Parent consent
          </h1>
          <p className="font-sans text-base leading-relaxed text-nga-slate">
            The magic-link consent flow for Explorers ships in Task 2.3. Your
            profile step is complete.
          </p>
        </div>

        <Link
          href="/onboarding/start"
          className="block text-center font-sans text-sm font-semibold text-nga-secondary underline-offset-4 hover:underline"
        >
          ← Back to profile
        </Link>
      </div>
    </section>
  );
}
