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
    <section className="flex min-h-0 flex-1 flex-col justify-start py-3 sm:pt-8 sm:pb-12">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-0">
        <h1 className="mb-4 text-center font-heading text-lg font-semibold text-nga-primary/70 sm:mb-6 sm:text-xl">
          Choose your path
        </h1>
        <div className="grid grid-cols-1 divide-y divide-[#031F82]/10 sm:grid-cols-3 sm:items-start sm:gap-8 sm:divide-y-0">
          {MASTERY_COHORT_ORDER.map((cohort) => {
            const label = masteryCohortLabel(cohort);
            const ageRange = masteryCohortAgeRangeLabel(cohort);

            return (
              <button
                key={cohort}
                type="button"
                onClick={() => handleSelect(cohort)}
                className="flex min-w-0 flex-row items-center gap-4 bg-transparent px-1 py-5 text-left transition-transform active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nga-secondary sm:flex-col sm:items-center sm:gap-0 sm:px-0 sm:py-0 sm:text-center sm:hover:scale-[1.03] sm:active:scale-[0.98]"
              >
                <span className="relative size-36 shrink-0 sm:aspect-square sm:h-auto sm:w-full sm:max-w-[16rem] sm:size-auto">
                  <Image
                    src={TRACK_AVATAR_SRC[cohort]}
                    alt={`${label} avatar`}
                    fill
                    sizes="(max-width: 639px) 144px, 256px"
                    className="object-contain"
                    unoptimized
                  />
                </span>
                <span className="flex min-w-0 flex-1 flex-col justify-center sm:flex-none sm:items-center">
                  <span className="font-heading text-3xl font-black leading-none text-nga-primary sm:mt-3">
                    {label}
                  </span>
                  <span className="mt-1 font-heading text-sm font-medium leading-tight text-nga-ink/60 sm:mt-1">
                    {ageRange} years
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
