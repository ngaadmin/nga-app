"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MASTERY_COHORT_ORDER,
  masteryCohortAgeRangeLabel,
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

const TRACK_AVATAR_SRC: Record<MasteryCohort, string> = {
  explorer: "/assets/illustrations/website/Avatars/Avatar_Explorer.webp",
  pathfinder: "/assets/illustrations/website/Avatars/Avatar_Pathfinder.webp",
  maverick: "/assets/illustrations/website/Avatars/Avatar_Maverick.webp",
};

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
    <section className="flex min-h-0 flex-1 flex-col py-2 sm:pt-8 sm:pb-12">
      <div className="mx-auto grid min-h-0 w-full max-w-4xl flex-1 grid-rows-3 gap-1 px-0 sm:flex-none sm:grid-cols-3 sm:grid-rows-1 sm:items-start sm:gap-8">
        {MASTERY_COHORT_ORDER.map((cohort) => {
          const label = masteryCohortLabel(cohort);
          const ageRange = masteryCohortAgeRangeLabel(cohort);

          return (
            <button
              key={cohort}
              type="button"
              onClick={() => handleSelect(cohort)}
              className="flex min-h-0 min-w-0 flex-col items-center justify-center bg-transparent px-2 py-1 text-center transition-transform hover:scale-[1.03] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nga-secondary sm:px-0 sm:py-0"
            >
              <span className="flex min-h-0 w-full flex-1 items-center justify-center sm:relative sm:aspect-square sm:max-w-[16rem] sm:flex-none">
                <span className="relative aspect-square h-full max-w-full sm:absolute sm:inset-0 sm:h-auto sm:w-auto sm:max-w-none">
                  <Image
                    src={TRACK_AVATAR_SRC[cohort]}
                    alt={`${label} avatar`}
                    fill
                    sizes="(max-width: 639px) 42vw, 256px"
                    className="object-contain"
                    unoptimized
                  />
                </span>
              </span>
              <span className="mt-1 shrink-0 font-heading text-2xl font-extrabold leading-tight text-nga-primary sm:mt-3 sm:text-xl">
                {label}
              </span>
              <span className="mt-0.5 shrink-0 font-heading text-lg font-bold leading-tight text-nga-ink sm:mt-1 sm:text-base">
                {ageRange} years
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
