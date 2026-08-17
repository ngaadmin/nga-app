import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { ONBOARDING_START_PATH } from "@/lib/onboarding/guest-session";

const FINN_HOMEPAGE_SRC =
  "/assets/illustrations/website/Finn_homepage.png";

export function OnboardingEntryGate() {
  return (
    <section className="flex flex-col py-4 sm:py-6 lg:flex-1 lg:justify-center lg:py-8">
      <div className="grid items-center gap-2 sm:gap-3 lg:grid-cols-2 lg:gap-6">
        <div className="order-1 flex items-center justify-center lg:order-none">
          <div className="w-full max-w-[18rem] overflow-hidden sm:max-w-[24rem] lg:max-w-none lg:overflow-visible">
            <Image
              src={FINN_HOMEPAGE_SRC}
              alt="Finn, your money-skills guide"
              width={720}
              height={720}
              className="-mb-[12%] -mt-[20%] h-auto w-full object-contain lg:mb-0 lg:mt-0"
              priority
              unoptimized
            />
          </div>
        </div>

        <div className="order-2 flex flex-col items-center text-center lg:order-none lg:items-start lg:text-left">
          <h1 className="font-heading text-3xl font-black leading-[1.08] tracking-tight text-nga-primary sm:text-4xl lg:text-5xl lg:leading-[1.08]">
            Finally. A fun way to learn money skills.
          </h1>
          <p className="mt-2 max-w-md font-sans text-base font-normal leading-relaxed text-nga-slate sm:mt-3 sm:text-lg lg:mt-4">
            Built like a game. Designed for real life.
          </p>
          <div className="mt-4 w-full max-w-sm sm:mt-6 lg:mt-8">
            <ButtonLink href={ONBOARDING_START_PATH} variant="cta" fullWidth>
              Try the Free App
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
