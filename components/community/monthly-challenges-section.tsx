"use client";

import { DashboardSectionHeading } from "@/components/dashboard/dashboard-section-heading";
import {
  demoMonthlyChallengeAchieverCount,
  isDemoMonthlyChallengeAchieved,
  isFutureMonthlyChallenge,
  MONTHLY_CHALLENGES,
} from "@/lib/dashboard/achievements-state";
import { cn } from "@/lib/utils/cn";

type ChallengeToneProps = {
  achieved: boolean;
  isFuture: boolean;
};

function statusLabel({ achieved, isFuture }: ChallengeToneProps) {
  if (achieved) return "Achieved";
  if (isFuture) return "Upcoming";
  return "Not Achieved";
}

function challengeToneClass({ achieved }: ChallengeToneProps) {
  return achieved
    ? "bg-[#031F82] text-white shadow-[0_4px_12px_rgba(3,31,130,0.28)]"
    : "bg-[#E8EEF2] text-[#8FA3B0]";
}

function iconWellClass({ achieved }: ChallengeToneProps) {
  return achieved
    ? "border-b-4 border-[#FFA503] bg-[#0CC1E0] shadow-[0_4px_12px_rgba(12,193,224,0.35)]"
    : "border-2 border-dashed border-[#C5D0D8] bg-white";
}

type MonthlyChallengeCardProps = {
  monthLabel: string;
  fullMonthName: string;
  challengeIcon: string;
  challengeName: string;
  achieved: boolean;
  isFuture: boolean;
  achieverCount: number;
};

function MonthlyChallengeCard({
  monthLabel,
  fullMonthName,
  challengeIcon,
  challengeName,
  achieved,
  isFuture,
  achieverCount,
}: MonthlyChallengeCardProps) {
  const tone = { achieved, isFuture };

  return (
    <article
      aria-label={`${fullMonthName}: ${challengeName} - ${statusLabel(tone)}`}
      className={cn(
        "flex min-h-0 flex-col items-center justify-center rounded-xl px-1 py-1.5 text-center",
        challengeToneClass(tone),
      )}
    >
      <h3
        className={cn(
          "w-full font-heading text-[8px] font-extrabold uppercase tracking-wide",
          achieved ? "text-white/90" : "text-[#8FA3B0]",
        )}
      >
        {monthLabel}
      </h3>

      <div
        className={cn(
          "mt-1 flex size-8 items-center justify-center rounded-full",
          iconWellClass(tone),
        )}
      >
        <span
          className={cn(
            "text-sm leading-none",
            !achieved && "opacity-55 grayscale",
          )}
          aria-hidden
        >
          {challengeIcon}
        </span>
      </div>

      <p
        className={cn(
          "mt-1 line-clamp-2 min-h-[1.6em] font-heading text-[8px] font-bold leading-tight",
          achieved ? "text-white" : "text-[#8FA3B0]",
        )}
      >
        {challengeName}
      </p>
      <p
        className={cn(
          "mt-0.5 font-heading text-[7px] font-bold uppercase tracking-wide",
          achieved ? "text-[#FFA503]" : "text-[#8FA3B0]/80",
        )}
      >
        {statusLabel(tone)}
      </p>
      <p
        className={cn(
          "mt-0.5 font-sans text-[7px] font-medium leading-tight",
          achieved ? "text-white/75" : "text-[#8FA3B0]/90",
        )}
      >
        {achieverCount.toLocaleString()} achieved
      </p>
    </article>
  );
}

function resolveChallengeView(monthIndex: number) {
  const challenge = MONTHLY_CHALLENGES[monthIndex];
  const isFuture = isFutureMonthlyChallenge(monthIndex);
  const achieved = !isFuture && isDemoMonthlyChallengeAchieved(monthIndex);
  return {
    challenge,
    isFuture,
    achieved,
    achieverCount: demoMonthlyChallengeAchieverCount(monthIndex),
  };
}

/** Compact this-month strip so the leaderboard can sit above the 12-month grid. */
export function CurrentMonthChallenge() {
  const monthIndex = new Date().getMonth();
  const { challenge, isFuture, achieved, achieverCount } =
    resolveChallengeView(monthIndex);
  if (!challenge) return null;
  const tone = { achieved, isFuture };

  return (
    <section aria-labelledby="this-month-challenge-heading" className="w-full">
      <h2
        id="this-month-challenge-heading"
        className="font-heading text-xs font-extrabold uppercase tracking-wide text-nga-primary"
      >
        This Month
      </h2>
      <article
        aria-label={`${challenge.fullMonthName}: ${challenge.challengeName} - ${statusLabel(tone)}`}
        className={cn(
          "mt-2 flex items-center gap-3 rounded-2xl px-3 py-2.5",
          challengeToneClass(tone),
        )}
      >
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            iconWellClass(tone),
          )}
        >
          <span
            className={cn(
              "text-xl leading-none",
              !achieved && "opacity-55 grayscale",
            )}
            aria-hidden
          >
            {challenge.challengeIcon}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-heading text-[10px] font-extrabold uppercase tracking-wide",
              achieved ? "text-white/90" : "text-[#8FA3B0]",
            )}
          >
            {challenge.fullMonthName}
          </p>
          <p
            className={cn(
              "mt-0.5 font-heading text-sm font-extrabold leading-tight",
              achieved ? "text-white" : "text-[#8FA3B0]",
            )}
          >
            {challenge.challengeName}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span
              className={cn(
                "font-heading text-[9px] font-bold uppercase tracking-wide",
                achieved ? "text-[#FFA503]" : "text-[#8FA3B0]/80",
              )}
            >
              {statusLabel(tone)}
            </span>
            <span
              className={cn(
                "font-sans text-[9px] font-medium",
                achieved ? "text-white/75" : "text-[#8FA3B0]/90",
              )}
            >
              {achieverCount.toLocaleString()} achieved this
            </span>
          </div>
        </div>
      </article>
    </section>
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
      <p className="mt-1 text-center font-sans text-[10px] leading-snug text-[#1E3A5F]/80">
        One seasonal challenge per month. Colour means you crushed it.
      </p>

      <div
        aria-label="Monthly challenge badges"
        className="mt-2 grid grid-cols-4 gap-1.5"
      >
        {MONTHLY_CHALLENGES.map((challenge, index) => {
          const { isFuture, achieved, achieverCount } =
            resolveChallengeView(index);

          return (
            <MonthlyChallengeCard
              key={challenge.id}
              monthLabel={challenge.monthLabel}
              fullMonthName={challenge.fullMonthName}
              challengeIcon={challenge.challengeIcon}
              challengeName={challenge.challengeName}
              achieved={achieved}
              isFuture={isFuture}
              achieverCount={achieverCount}
            />
          );
        })}
      </div>
    </section>
  );
}
