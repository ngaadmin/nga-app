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
    <section className="flex min-h-0 flex-1 flex-col justify-start py-1 sm:pt-8 sm:pb-12">
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-1 px-0 sm:grid-cols-3 sm:items-start sm:gap-8">
        {MASTERY_COHORT_ORDER.map((cohort) => {
          const label = masteryCohortLabel(cohort);
          const ageRange = masteryCohortAgeRangeLabel(cohort);

          return (
            <button
              key={cohort}
              type="button"
              onClick={() => handleSelect(cohort)}
              className="flex min-w-0 flex-col items-center justify-center bg-transparent px-2 py-1.5 text-center transition-transform hover:scale-[1.03] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nga-secondary sm:px-0 sm:py-0"
            >
              <span className="relative size-24 shrink-0 sm:aspect-square sm:h-auto sm:w-full sm:max-w-[16rem] sm:size-auto">
                <Image
                  src={TRACK_AVATAR_SRC[cohort]}
                  alt={`${label} avatar`}
                  fill
                  sizes="(max-width: 639px) 96px, 256px"
                  className="object-contain"
                  unoptimized
                />
              </span>
              <span className="mt-0.5 shrink-0 font-heading text-xl font-extrabold leading-tight text-nga-primary sm:mt-3 sm:text-xl">
                {label}
              </span>
              <span className="mt-0 shrink-0 font-heading text-base font-bold leading-tight text-nga-ink sm:mt-1 sm:text-base">
                {ageRange} years
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
