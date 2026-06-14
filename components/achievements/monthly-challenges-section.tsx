"use client";

import { ACHIEVEMENTS_HORIZONTAL_CAROUSEL_CLASS } from "@/components/achievements/achievements-carousel";
import { DashboardSectionHeading } from "@/components/dashboard/dashboard-section-heading";
import {
  isDemoMonthlyChallengeAchieved,
  MONTHLY_CHALLENGES,
} from "@/lib/dashboard/achievements-state";
import { cn } from "@/lib/utils/cn";

const NGA_CORPORATE_BLUE = "#031F82";

type MonthlyChallengeCardProps = {
  fullMonthName: string;
  challengeIcon: string;
  challengeName: string;
  achieved: boolean;
};

function MonthlyChallengeCard({
  fullMonthName,
  challengeIcon,
  challengeName,
  achieved,
}: MonthlyChallengeCardProps) {
  return (
    <article
      aria-label={`${fullMonthName}: ${challengeName} - ${achieved ? "achieved" : "not achieved"}`}
      className={cn(
        "flex w-[5.5rem] shrink-0 snap-center flex-col items-center rounded-xl px-2 py-3 text-center sm:w-[6rem]",
        achieved ? "bg-[#031F82]/[0.04]" : "bg-white",
      )}
    >
      <h3
        className={cn(
          "w-full font-heading text-[9px] font-extrabold uppercase tracking-wide sm:text-[10px]",
          achieved ? "text-[#031F82]" : "text-[#031F82]/55",
        )}
      >
        {fullMonthName}
      </h3>

      <div
        className={cn(
          "mt-2 flex size-12 items-center justify-center rounded-full sm:size-14",
          achieved
            ? "border-b-4 border-[#02145C] shadow-[0_4px_12px_rgba(3,31,130,0.35)]"
            : "border-2 border-dashed border-[#C5D0D8] bg-white",
        )}
        style={achieved ? { backgroundColor: NGA_CORPORATE_BLUE } : undefined}
      >
        <span
          className={cn(
            "text-xl leading-none sm:text-2xl",
            achieved ? "drop-shadow-sm" : "opacity-60 grayscale",
          )}
          aria-hidden
        >
          {challengeIcon}
        </span>
      </div>

      <p
        className={cn(
          "mt-2 font-heading text-[8px] font-bold uppercase tracking-wide sm:text-[9px]",
          achieved ? "text-[#031F82]" : "text-[#031F82]/40",
        )}
      >
        {achieved ? "Achieved" : "Not Achieved"}
      </p>
    </article>
  );
}

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
        One seasonal challenge per month - swipe through your year.
      </p>

      <div
        aria-label="Monthly challenge badges"
        className={cn(
          ACHIEVEMENTS_HORIZONTAL_CAROUSEL_CLASS,
          "mt-4 gap-2 rounded-2xl bg-white px-2 py-3 shadow-md sm:gap-3",
        )}
      >
        {MONTHLY_CHALLENGES.map((challenge, index) => (
          <MonthlyChallengeCard
            key={challenge.id}
            fullMonthName={challenge.fullMonthName}
            challengeIcon={challenge.challengeIcon}
            challengeName={challenge.challengeName}
            achieved={isDemoMonthlyChallengeAchieved(index)}
          />
        ))}
      </div>
    </section>
  );
}
