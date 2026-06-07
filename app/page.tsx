import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-nga-xl bg-nga-surface p-8 text-center shadow-nga-card">
        <p className="font-heading text-sm font-bold uppercase tracking-wide text-nga-secondary">
          NextGenAchievers
        </p>
        <h1 className="mt-3 font-heading text-2xl font-bold text-nga-primary">
          Your financial cockpit is warming up.
        </h1>
        <p className="mt-3 font-sans text-nga-slate">
          Milestone 1 brand system is live. Verify the palette, then ship
          onboarding.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/design-system"
            className="inline-flex h-touch items-center justify-center rounded-nga-lg bg-nga-cta px-6 font-heading text-base font-bold text-nga-ink transition-colors hover:bg-nga-cta-hover"
          >
            Open design system
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex h-touch items-center justify-center rounded-nga-lg bg-nga-primary px-6 font-heading text-base font-bold text-white transition-colors hover:bg-nga-primary-hover"
          >
            Start onboarding
          </Link>
        </div>
      </div>
    </main>
  );
}
