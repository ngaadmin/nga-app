import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { ONBOARDING_START_PATH } from "@/lib/onboarding/guest-session";

const FINN_HOMEPAGE_SRC =
  "/assets/illustrations/website/Finn_homepage.png";

export function OnboardingEntryGate() {
  return (
    <section className="flex flex-1 flex-col justify-center py-6 sm:py-8">
      <div className="grid items-center gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="order-1 flex items-center justify-center lg:order-none">
          <Image
            src={FINN_HOMEPAGE_SRC}
            alt="Finn, your money-skills guide"
            width={720}
            height={720}
            className="h-auto w-full max-w-[22rem] object-contain sm:max-w-[28rem] lg:max-w-none"
            priority
            unoptimized
          />
        </div>

        <div className="order-2 flex flex-col items-center text-center lg:order-none lg:items-start lg:text-left">
          <h1 className="font-heading text-3xl font-black leading-[1.08] tracking-tight text-nga-primary sm:text-4xl lg:text-5xl lg:leading-[1.08]">
            Finally. A fun way to learn money skills.
          </h1>
          <p className="mt-3 max-w-md font-sans text-base font-normal leading-relaxed text-nga-slate sm:mt-4 sm:text-lg">
            Built like a game. Designed for real life.
          </p>
          <div className="mt-6 w-full max-w-sm sm:mt-8">
            <ButtonLink href={ONBOARDING_START_PATH} variant="cta" fullWidth>
              Try the Free App
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
