"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MASTERY_COHORT_ORDER,
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import { wipeGuestDeviceProgress } from "@/lib/dev/guest-device-store";
import { reserveGenericProfileId } from "@/lib/onboarding/generic-profile-id";
import {
  createGuestAccessSession,
  DASHBOARD_ACADEMY_PATH,
  saveGuestAccessSession,
} from "@/lib/onboarding/guest-session";
import { recordUsageEvent } from "@/lib/usage/record-usage-event";

const TRACK_AVATAR_SRC: Record<
  MasteryCohort,
  { src: string; width: number; height: number; figureClassName: string }
> = {
  explorer: {
    src: "/assets/illustrations/characters/lars/lars-waving-512.webp",
    width: 191,
    height: 391,
    figureClassName: "h-[80px] min-[721px]:h-[200px]",
  },
  pathfinder: {
    src: "/assets/illustrations/characters/holly/holly-waving-512.webp",
    width: 199,
    height: 391,
    figureClassName: "h-[78px] min-[721px]:h-[194px]",
  },
  maverick: {
    src: "/assets/illustrations/characters/aiden/aiden-waving-512.webp",
    width: 207,
    height: 391,
    figureClassName: "h-[80px] min-[721px]:h-[200px]",
  },
};

const PENNY_AVATAR_SRC =
  "/assets/illustrations/characters/penny/penny-master-512.webp";

export function CohortTrackPicker() {
  const router = useRouter();

  function handleSelect(cohort: MasteryCohort) {
    // Explorer -> explorer, Pathfinder -> pathfinder, Maverick -> maverick.
    const reserved = reserveGenericProfileId();
    const session = createGuestAccessSession({
      username: reserved.username,
      genericProfileId: reserved.id,
      curriculumCohort: cohort,
    });
    wipeGuestDeviceProgress();
    saveGuestAccessSession(session);
    recordUsageEvent("login");
    router.push(DASHBOARD_ACADEMY_PATH);
  }

  return (
    <section className="nga-preapp-screen -mx-6 flex min-h-0 w-[calc(100%+3rem)] flex-1 flex-col bg-white px-5 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] min-[721px]:justify-center min-[721px]:pt-[calc(env(safe-area-inset-top,0px)+4.25rem)]">
      <style>{`
        body:has(.nga-preapp-screen) footer {
          margin-top: 36px;
          text-align: center;
        }
      `}</style>
      <div className="mx-auto flex w-full max-w-[960px] flex-col min-[721px]:translate-y-6">
        <div className="flex flex-col items-center text-center">
          <Image
            src={PENNY_AVATAR_SRC}
            alt=""
            width={508}
            height={512}
            className="h-auto w-[72px] object-contain object-center min-[721px]:w-[96px]"
            priority
            unoptimized
          />
          <h1 className="mt-3 font-heading text-[30px] font-bold leading-[1.15] tracking-[-0.01em] text-[#031F82] min-[721px]:text-[40px]">
            Pick the path that matches your age.
          </h1>
        </div>

        <div className="mt-6 flex flex-col gap-3 min-[721px]:mt-8 min-[721px]:grid min-[721px]:grid-cols-3 min-[721px]:gap-6">
          {MASTERY_COHORT_ORDER.map((cohort) => {
            const label = masteryCohortLabel(cohort);
            const ageSupport = `For ages ${masteryCohortAgeRangeLabel(cohort)}`;
            const avatar = TRACK_AVATAR_SRC[cohort];

            return (
              <button
                key={cohort}
                type="button"
                onClick={() => handleSelect(cohort)}
                className="flex min-h-[104px] w-full flex-row items-center gap-[18px] rounded-[16px] border-0 bg-[#FFF8EC] py-3 pl-5 pr-4 text-left shadow-none hover:shadow-[0_0_0_2px_#031F82] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#031F82] active:shadow-[0_0_0_2px_#031F82] min-[721px]:flex-col min-[721px]:items-center min-[721px]:gap-0 min-[721px]:rounded-[20px] min-[721px]:px-5 min-[721px]:pb-[26px] min-[721px]:pt-7 min-[721px]:text-center"
              >
                <span className="flex h-[80px] w-[52px] shrink-0 items-end justify-center min-[721px]:h-[200px] min-[721px]:w-full">
                  <Image
                    src={avatar.src}
                    alt=""
                    width={avatar.width}
                    height={avatar.height}
                    className={`${avatar.figureClassName} w-auto max-w-full object-contain object-bottom`}
                    style={{ width: "auto" }}
                    unoptimized
                  />
                </span>
                <span className="flex min-w-0 flex-1 flex-col justify-center min-[721px]:mt-[18px] min-[721px]:w-full min-[721px]:items-center">
                  <span className="font-heading text-[20px] font-bold leading-tight tracking-[-0.01em] text-[#031F82] min-[721px]:text-[22px]">
                    {label}
                  </span>
                  <span className="mt-[2px] font-sans text-[15px] font-normal leading-snug text-[#3a4570] min-[721px]:mt-1 min-[721px]:text-[17px]">
                    {ageSupport}
                  </span>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-6 shrink-0 text-[#031F82] min-[721px]:hidden"
                  aria-hidden
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
