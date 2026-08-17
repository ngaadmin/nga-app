"use client";

import { DashboardSectionHeading } from "@/components/dashboard/dashboard-section-heading";
import {
  demoMonthlyChallengeAchieverCount,
  isDemoMonthlyChallengeAchieved,
  isFutureMonthlyChallenge,
  MONTHLY_CHALLENGES,
} from "@/lib/dashboard/achievements-state";
import { cn } from "@/lib/utils/cn";

type MonthlyChallengeCardProps = {
  fullMonthName: string;
  challengeIcon: string;
  challengeName: string;
  achieved: boolean;
  isFuture: boolean;
  achieverCount: number;
};

function MonthlyChallengeCard({
  fullMonthName,
  challengeIcon,
  challengeName,
  achieved,
  isFuture,
  achieverCount,
}: MonthlyChallengeCardProps) {
  const greyed = !achieved;

  return (
    <article
      aria-label={`${fullMonthName}: ${challengeName} - ${achieved ? "achieved" : isFuture ? "upcoming" : "not achieved"}`}
      className={cn(
        "flex min-h-[8.5rem] flex-col items-center justify-between rounded-2xl px-2 py-3 text-center",
        achieved
          ? "bg-[#031F82] text-white shadow-[0_4px_12px_rgba(3,31,130,0.28)]"
          : "bg-[#E8EEF2] text-[#8FA3B0]",
      )}
    >
      <h3
        className={cn(
          "w-full font-heading text-[9px] font-extrabold uppercase tracking-wide sm:text-[10px]",
          achieved ? "text-white/90" : "text-[#8FA3B0]",
        )}
      >
        {fullMonthName}
      </h3>

      <div
        className={cn(
          "mt-2 flex size-12 items-center justify-center rounded-full sm:size-14",
          achieved
            ? "border-b-4 border-[#FFA503] bg-[#0CC1E0] shadow-[0_4px_12px_rgba(12,193,224,0.35)]"
            : "border-2 border-dashed border-[#C5D0D8] bg-white",
        )}
      >
        <span
          className={cn(
            "text-xl leading-none sm:text-2xl",
            greyed && "opacity-55 grayscale",
          )}
          aria-hidden
        >
          {challengeIcon}
        </span>
      </div>

      <p
        className={cn(
          "mt-2 line-clamp-2 font-heading text-[8px] font-bold leading-tight sm:text-[9px]",
          achieved ? "text-white" : "text-[#8FA3B0]",
        )}
      >
        {challengeName}
      </p>
      <p
        className={cn(
          "mt-1 font-heading text-[8px] font-bold uppercase tracking-wide",
          achieved ? "text-[#FFA503]" : "text-[#8FA3B0]/80",
        )}
      >
        {achieved ? "Achieved" : isFuture ? "Upcoming" : "Not Achieved"}
      </p>
      <p
        className={cn(
          "mt-1 font-sans text-[8px] font-medium leading-tight",
          achieved ? "text-white/75" : "text-[#8FA3B0]/90",
        )}
      >
        {achieverCount.toLocaleString()} achieved this
      </p>
    </article>
  );
}

/** Community hub — monthly challenge tiles. */
export function MonthlyChallengesSection() {
  return (
    <section
      aria-labelledby="monthly-challenges-heading"
      className="w-full shrink-0"
    >
      <DashboardSectionHeading id="monthly-challenges-heading">
        Monthly Challenges
      </DashboardSectionHeading>
      <p className="mt-2 text-center font-sans text-[10px] leading-relaxed text-[#1E3A5F]/80">
        One seasonal challenge per month. Colour means you crushed it.
      </p>

      <div
        aria-label="Monthly challenge badges"
        className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4"
      >
        {MONTHLY_CHALLENGES.map((challenge, index) => {
          const isFuture = isFutureMonthlyChallenge(index);
          const achieved =
            !isFuture && isDemoMonthlyChallengeAchieved(index);

          return (
            <MonthlyChallengeCard
              key={challenge.id}
              fullMonthName={challenge.fullMonthName}
              challengeIcon={challenge.challengeIcon}
              challengeName={challenge.challengeName}
              achieved={achieved}
              isFuture={isFuture}
              achieverCount={demoMonthlyChallengeAchieverCount(index)}
            />
          );
        })}
      </div>
    </section>
  );
}
