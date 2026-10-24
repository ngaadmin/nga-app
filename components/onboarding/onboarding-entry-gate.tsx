import Image from "next/image";
import Link from "next/link";
import { PrefetchAcademy } from "@/components/onboarding/prefetch-academy";
import { copyMatrix } from "@/constants/copyMatrix";
import {
  ONBOARDING_SIGN_IN_PATH,
  ONBOARDING_START_PATH,
} from "@/lib/onboarding/guest-session";

const PENNY_HOMEPAGE_SRC =
  "/assets/illustrations/characters/penny/penny-master-512.webp";

/** Local to this screen so the shared button variants stay orange and uppercase. */
const welcomeActionClass =
  "inline-flex h-[52px] min-h-[52px] w-full min-w-[190px] items-center justify-center rounded-[12px] px-7 font-heading text-[16px] font-bold text-[#031F82] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#031F82] min-[721px]:w-auto";

type OnboardingEntryGateProps = {
  /** Defaults to the learner try-the-app path. /school passes teacher signup. */
  signUpHref?: string;
  subtitle?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
};

export function OnboardingEntryGate({
  signUpHref = ONBOARDING_START_PATH,
  subtitle = "Built like a game. Designed for real life.",
  primaryCtaLabel = "Try the free app",
  secondaryCtaLabel = copyMatrix.onboarding.signIn.heroLogIn,
}: OnboardingEntryGateProps) {
  return (
    <section className="nga-preapp-screen flex flex-col pb-4 pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] sm:pb-6 sm:pt-[calc(env(safe-area-inset-top,0px)+3rem)] min-[721px]:flex-1 min-[721px]:justify-center min-[721px]:pb-10 min-[721px]:pt-[calc(env(safe-area-inset-top,0px)+5.5rem)]">
      {signUpHref === ONBOARDING_START_PATH ? <PrefetchAcademy /> : null}
      <style>{`
        body:has(.nga-preapp-screen) footer {
          margin-top: 36px;
          text-align: center;
        }
      `}</style>
      <div className="grid items-center gap-5 min-[721px]:translate-y-12 min-[721px]:gap-7 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-x-7">
        <div className="order-1 flex items-center justify-center lg:order-none lg:justify-end">
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
          <h1 className="font-heading text-[clamp(36px,4.5vw,56px)] font-bold leading-[1.08] text-[#031F82]">
            Finally. A fun way to learn money skills.
          </h1>
          <p className="mt-2 max-w-md font-sans text-[18px] font-normal leading-relaxed text-[#3a4570] sm:mt-3 lg:mt-4">
            {subtitle}
          </p>
          <div className="mt-4 flex w-full flex-col gap-3 sm:mt-6 min-[721px]:w-auto min-[721px]:flex-row lg:mt-8">
            <Link
              href={signUpHref}
              className={`${welcomeActionClass} bg-[#FFC93C] shadow-[0_2px_0_#d9a12a] hover:bg-[#FFD66B]`}
            >
              {primaryCtaLabel}
            </Link>
            <Link
              href={ONBOARDING_SIGN_IN_PATH}
              className={`${welcomeActionClass} border-2 border-[#031F82] bg-white hover:bg-[#FFF8EC]`}
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
