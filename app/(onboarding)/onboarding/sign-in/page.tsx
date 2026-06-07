import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Welcome back to NextGenAchievers.",
};

export default function OnboardingSignInPage() {
  return (
    <section className="flex flex-1 flex-col justify-center py-12">
      <h1 className="font-heading text-2xl font-bold text-nga-primary">
        Welcome back.
      </h1>
      <p className="mt-3 font-sans text-nga-slate">
        Account sign-in connects to Supabase in a later milestone.
      </p>
      <Link
        href="/onboarding"
        className="mt-6 font-sans text-sm font-semibold text-nga-secondary underline-offset-4 hover:underline"
      >
        ← Back to entry
      </Link>
    </section>
  );
}
