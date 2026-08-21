import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { copyMatrix } from "@/constants/copyMatrix";
import {
  ONBOARDING_SIGN_IN_PATH,
  ONBOARDING_START_PATH,
} from "@/lib/onboarding/guest-session";

const PENNY_HOMEPAGE_SRC = "/assets/illustrations/website/Penny.png";

export function OnboardingEntryGate() {
  return (
    <section className="flex flex-col py-4 sm:py-6 lg:flex-1 lg:justify-center lg:py-8">
      <div className="grid items-center gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-8">
        <div className="order-1 flex items-center justify-center lg:order-none">
          <div className="flex w-full max-w-[15.6rem] items-center justify-center sm:max-w-[18rem] lg:max-w-[19.5rem]">
            <Image
              src={PENNY_HOMEPAGE_SRC}
              alt="Penny, your money-skills guide"
              width={720}
              height={720}
              className="h-auto max-h-[14.1rem] w-full object-contain object-center sm:max-h-[16.8rem] lg:max-h-[19.5rem]"
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
          <div className="mt-4 flex w-full max-w-sm flex-col gap-3 sm:mt-6 lg:mt-8">
            <ButtonLink href={ONBOARDING_START_PATH} variant="cta" fullWidth>
              Try the Free App
            </ButtonLink>
            <ButtonLink
              href={ONBOARDING_SIGN_IN_PATH}
              variant="secondary-outline"
              fullWidth
            >
              {copyMatrix.onboarding.signIn.heroLogIn}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
