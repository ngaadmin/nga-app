import { ButtonLink } from "@/components/ui/button";

export function OnboardingEntryGate() {
  return (
    <section className="flex flex-1 flex-col justify-center py-8 lg:py-12">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div
          className="order-1 flex min-h-[220px] items-center justify-center rounded-nga-xl border-2 border-dashed border-nga-panel bg-nga-mist/30 p-8 sm:min-h-[280px] lg:order-none lg:min-h-[360px]"
          aria-label="Character illustration placeholder"
        >
          <div className="text-center">
            <p className="font-heading text-sm font-bold uppercase tracking-widest text-nga-secondary">
              Your guide
            </p>
            <p className="mt-2 max-w-xs font-sans text-sm text-nga-slate">
              Vector character / avatar illustration ships here - your savvy
              mentor on the money journey.
            </p>
          </div>
        </div>

        <div className="order-2 flex flex-col items-center text-center lg:order-none lg:items-start lg:text-left">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-4xl lg:text-[2.5rem] lg:leading-[1.15]">
            The free, fun, and effective way to master real-world money
            skills!
          </h1>
          <div className="mt-8 flex w-full max-w-sm flex-col gap-4">
            <ButtonLink href="/onboarding/start?fresh=1" variant="cta" fullWidth>
              Get started
            </ButtonLink>
            <ButtonLink
              href="/onboarding/start"
              variant="secondary-outline"
              fullWidth
            >
              I already have an account
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
