"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MASTERY_COHORT_ORDER,
  masteryCohortLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import { representativeBirthYearForCohort } from "@/lib/onboarding/birth-years";
import { reserveGenericProfileId } from "@/lib/onboarding/generic-profile-id";
import {
  createGuestAccessSession,
  DASHBOARD_ACADEMY_PATH,
  saveGuestAccessSession,
} from "@/lib/onboarding/guest-session";

/** Supporting age lines for this screen only — cohort bounds stay in mastery-cohort. */
const TRACK_AGE_SUPPORT: Record<MasteryCohort, string> = {
  explorer: "For ages 10–12",
  pathfinder: "For ages 13–15",
  maverick: "For ages 16+",
};

const TRACK_AVATAR_SRC: Record<MasteryCohort, string> = {
  explorer: "/assets/illustrations/website/Avatars/Lars-onboarding.webp",
  pathfinder: "/assets/illustrations/website/Avatars/Aiden-onboarding.webp",
  maverick: "/assets/illustrations/website/Avatars/Saskia-onboarding.webp",
};

const PENNY_POINT_SRC =
  "/assets/illustrations/characters/penny/penny_point.webp";

export function CohortTrackPicker() {
  const router = useRouter();

  function handleSelect(cohort: MasteryCohort) {
    // Explorer -> explorer, Pathfinder -> pathfinder, Maverick -> maverick.
    const reserved = reserveGenericProfileId();
    const session = createGuestAccessSession({
      username: reserved.username,
      birthYear: representativeBirthYearForCohort(cohort),
      genericProfileId: reserved.id,
      curriculumCohort: cohort,
      birthYearLocked: false,
    });
    saveGuestAccessSession(session);
    router.push(DASHBOARD_ACADEMY_PATH);
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-white pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-between">
        <div className="flex flex-col items-center text-center">
          <Image
            src={PENNY_POINT_SRC}
            alt=""
            width={720}
            height={720}
            className="h-[6.5rem] w-[6.5rem] object-contain object-center"
            priority
            unoptimized
          />
          <h1 className="mt-1 font-heading text-3xl font-black leading-[1.08] tracking-tight text-nga-primary">
            Pick the path that matches your age.
          </h1>
        </div>

        {MASTERY_COHORT_ORDER.map((cohort) => {
          const label = masteryCohortLabel(cohort);
          const ageSupport = TRACK_AGE_SUPPORT[cohort];

          return (
            <button
              key={cohort}
              type="button"
              onClick={() => handleSelect(cohort)}
              className="flex w-full items-center gap-4 bg-transparent text-left transition-transform active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nga-secondary"
            >
              <Image
                src={TRACK_AVATAR_SRC[cohort]}
                alt=""
                width={480}
                height={480}
                className="h-[6.5rem] w-[6.5rem] shrink-0 object-contain object-center"
                unoptimized
              />
              <span className="flex min-w-0 flex-1 flex-col justify-center">
                <span className="font-heading text-2xl font-black leading-[1.08] tracking-tight text-nga-primary">
                  {label}
                </span>
                <span className="mt-0.5 font-sans text-base font-normal leading-snug text-nga-slate">
                  {ageSupport}
                </span>
              </span>
            </button>
          );
        })}

        <p className="text-center font-sans text-base font-normal leading-relaxed text-nga-slate">
          You can switch this later.
        </p>
      </div>
    </section>
  );
}
