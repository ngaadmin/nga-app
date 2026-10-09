"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LAYER_CLASS } from "@/lib/ui/layers";
import { cn } from "@/lib/utils/cn";
import {
  ACADEMY_LESSON_PREVIEW_COHORT_PARAM,
  M1_L5_LOCAL_PREVIEW_PATH,
  parseAcademyPreviewCohort,
} from "@/lib/dev/academy-dev-tools";
import {
  MASTERY_COHORT_ORDER,
  masteryCohortLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";

/** Dev/QA only — switch Module 1 Lesson 5 copy and images by cohort. */
export function M1L5CohortPreviewBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = parseAcademyPreviewCohort(searchParams);

  const jumpTo = (cohort: MasteryCohort) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(ACADEMY_LESSON_PREVIEW_COHORT_PARAM, cohort);
    router.replace(`${M1_L5_LOCAL_PREVIEW_PATH}?${params.toString()}`, {
      scroll: false,
    });
  };

  return (
    <nav
      aria-label="Preview mastery cohort"
      className={cn(
        "sticky top-0 shrink-0 border-b border-[#031F82] bg-white px-3 py-2 text-[#031F82]",
        LAYER_CLASS.dev,
      )}
    >
      <p className="mb-1.5 font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-[#031F82]/70">
        Local preview · Module 1 · Lesson 5
      </p>
      <div className="flex flex-wrap gap-1.5">
        {MASTERY_COHORT_ORDER.map((cohort) => {
          const isActive = cohort === active;
          return (
            <button
              key={cohort}
              type="button"
              aria-current={isActive ? "true" : undefined}
              onClick={() => jumpTo(cohort)}
              className={cn(
                "rounded-full border border-[#031F82] px-2.5 py-1 font-sans text-[11px] font-semibold leading-tight",
                isActive
                  ? "bg-[#031F82] text-white"
                  : "bg-white text-[#031F82]",
              )}
            >
              {masteryCohortLabel(cohort)}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
