"use client";

import { useMemo, type ReactNode } from "react";
import { buildStreakChallengesView } from "@/lib/dashboard/streak-challenges";
import { cn } from "@/lib/utils/cn";

function SubHeading({ id, children }: { id: string; children: string }) {
  return (
    <h4
      id={id}
      className="font-heading text-[11px] font-bold uppercase tracking-wide text-[#8FA3B0]"
    >
      {children}
    </h4>
  );
}

function EmptyLine({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border-2 border-dashed border-[#C5D0D8] bg-white px-3 py-2.5 font-sans text-xs text-[#1E3A5F]/80">
      {children}
    </p>
  );
}

function ChallengeGroup({
  id,
  title,
  upcoming,
  achieved,
}: {
  id: string;
  title: string;
  upcoming: ReactNode;
  achieved: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      data-challenge-group={id}
      className="rounded-2xl bg-[#F7FBFF] px-4 py-3"
    >
      <h3
        id={`${id}-heading`}
        className="font-heading text-base font-extrabold text-[#031F82]"
      >
        {title}
      </h3>
      <div className="mt-2 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5" data-challenge-list="upcoming">
          <SubHeading id={`${id}-upcoming`}>Upcoming</SubHeading>
          {upcoming}
        </div>
        <div className="flex flex-col gap-1.5" data-challenge-list="achieved">
          <SubHeading id={`${id}-achieved`}>Achieved</SubHeading>
          {achieved}
        </div>
      </div>
    </section>
  );
}

/** Weekly and monthly challenges under the streak detail view. */
export function StreakChallengesSection() {
  const view = useMemo(() => buildStreakChallengesView(new Date()), []);

  return (
    <div className="mt-2 flex flex-col gap-3">
      <ChallengeGroup
        id="weekly-challenges"
        title="Weekly challenges"
        upcoming={<EmptyLine>No weekly challenges yet. Check back soon.</EmptyLine>}
        achieved={
          <EmptyLine>Weekly challenges you finish will show up here.</EmptyLine>
        }
      />
      <ChallengeGroup
        id="monthly-challenges"
        title="Monthly challenges"
        upcoming={
          view.monthly.upcoming.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {view.monthly.upcoming.map((challenge) => (
                <li
                  key={challenge.id}
                  data-monthly-challenge={challenge.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl bg-white px-3 py-2",
                    challenge.isCurrentMonth && "ring-2 ring-[#FFA503]",
                  )}
                >
                  <span className="text-xl" aria-hidden>
                    {challenge.challengeIcon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-heading text-sm font-bold text-[#031F82]">
                      {challenge.challengeName}
                    </span>
                    <span className="block font-sans text-[11px] text-[#8FA3B0]">
                      {challenge.isCurrentMonth
                        ? `This month (${challenge.fullMonthName})`
                        : challenge.fullMonthName}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyLine>No monthly challenges yet. Check back soon.</EmptyLine>
          )
        }
        achieved={
          view.monthly.achieved.length > 0 ? null : (
            <EmptyLine>Monthly challenges you finish will show up here.</EmptyLine>
          )
        }
      />
    </div>
  );
}
