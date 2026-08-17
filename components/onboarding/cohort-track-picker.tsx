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
    <section className="flex flex-1 flex-col justify-start pt-4 pb-8 sm:pt-8 sm:pb-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-0">
        <div className="flex w-full items-start justify-center gap-1 sm:gap-8">
          {MASTERY_COHORT_ORDER.map((cohort) => {
            const label = masteryCohortLabel(cohort);
            const ageRange = masteryCohortAgeRangeLabel(cohort);

            return (
              <button
                key={cohort}
                type="button"
                onClick={() => handleSelect(cohort)}
                className="flex min-w-0 flex-1 flex-col items-center bg-transparent p-0 text-center transition-transform hover:scale-[1.03] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nga-secondary"
              >
                <span className="relative block aspect-square w-full max-w-[11.5rem] sm:max-w-[16rem]">
                  <Image
                    src={TRACK_AVATAR_SRC[cohort]}
                    alt={`${label} avatar`}
                    fill
                    sizes="(max-width: 640px) 32vw, 256px"
                    className="object-contain"
                    unoptimized
                  />
                </span>
                <span className="mt-3 font-heading text-sm font-extrabold text-nga-primary sm:text-xl">
                  {label}
                </span>
                <span className="mt-1 font-heading text-xs font-bold text-nga-ink sm:text-base">
                  {ageRange} years
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
