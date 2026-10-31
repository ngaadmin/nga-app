"use client";

import Image from "next/image";
import { cohortTrackPicture } from "@/lib/dashboard/cohort-track-pictures";
import {
  MASTERY_COHORT_ORDER,
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import { cn } from "@/lib/utils/cn";

type LearnerTrackCardsProps = {
  value: MasteryCohort | null;
  onChange: (cohort: MasteryCohort) => void;
  error?: string;
};

export function LearnerTrackCards({
  value,
  onChange,
  error,
}: LearnerTrackCardsProps) {
  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-label="Pick the path that matches your age."
        className="flex flex-col gap-3"
      >
        {MASTERY_COHORT_ORDER.map((track) => {
          const selected = value === track;
          const label = masteryCohortLabel(track);
          const ageSupport = `For ages ${masteryCohortAgeRangeLabel(track)}`;
          const picture = cohortTrackPicture(track);
          return (
            <button
              key={track}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                if (selected) return;
                onChange(track);
              }}
              className={cn(
                "flex h-[132px] items-center gap-3.5 rounded-3xl pl-2.5 pr-[18px] text-left",
                selected ? "bg-nga-panel" : "bg-[#EDF5FF]",
              )}
            >
              <span
                aria-hidden
                className="flex h-[100px] w-[100px] shrink-0 items-end justify-center"
              >
                <Image
                  src={picture.src}
                  alt=""
                  width={picture.width}
                  height={picture.height}
                  className="h-[100px] w-auto max-w-full object-contain object-bottom"
                  style={{ width: "auto" }}
                  unoptimized
                />
              </span>
              <span className="flex min-w-0 flex-1 flex-col justify-center">
                <span className="font-heading text-[22px] font-extrabold leading-tight text-nga-primary">
                  {label}
                </span>
                <span className="mt-0.5 font-sans text-base leading-snug text-nga-slate">
                  {ageSupport}
                </span>
              </span>
              {selected ? (
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-nga-primary text-sm font-bold text-white"
                >
                  ✓
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="font-sans text-sm font-medium text-[#031F82]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
