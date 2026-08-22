"use client";

import { useState } from "react";
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
    ? "border border-[#0CC1E0]/40 bg-[#BDE9FB]/35 text-[#031F82]"
    : "border border-[#BDE9FB]/50 bg-[#F7FBFF] text-[#031F82]/40";
}

function iconWellClass({ achieved }: ChallengeToneProps) {
  return achieved
    ? "bg-[#0CC1E0]/20 ring-2 ring-[#0CC1E0]/80"
    : "border border-dashed border-[#BDE9FB] bg-white";
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
        "flex min-h-0 flex-col items-center justify-center rounded-xl px-0.5 py-1 text-center",
        challengeToneClass(tone),
      )}
    >
      <h3
        className={cn(
          "w-full font-heading text-[8px] font-extrabold uppercase tracking-wide",
          achieved ? "text-[#031F82]/80" : "text-[#031F82]/40",
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
          achieved ? "text-[#031F82]" : "text-[#031F82]/40",
        )}
      >
        {challengeName}
      </p>
      <p
        className={cn(
          "mt-0.5 font-heading text-[7px] font-bold uppercase tracking-wide",
          achieved ? "text-[#C88202]" : "text-[#031F82]/35",
        )}
      >
        {statusLabel(tone)}
      </p>
      <p
        className={cn(
          "mt-0.5 font-sans text-[7px] font-medium leading-tight",
          achieved ? "text-[#031F82]/55" : "text-[#031F82]/30",
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
          "mt-2 flex items-center gap-3 rounded-2xl px-2.5 py-2",
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
              achieved ? "text-[#031F82]/75" : "text-[#031F82]/40",
            )}
          >
            {challenge.fullMonthName}
          </p>
          <p
            className={cn(
              "mt-0.5 font-heading text-sm font-extrabold leading-tight",
              achieved ? "text-[#031F82]" : "text-[#031F82]/40",
            )}
          >
            {challenge.challengeName}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span
              className={cn(
                "font-heading text-[9px] font-bold uppercase tracking-wide",
                achieved ? "text-[#C88202]" : "text-[#031F82]/35",
              )}
            >
              {statusLabel(tone)}
            </span>
            <span
              className={cn(
                "font-sans text-[9px] font-medium",
                achieved ? "text-[#031F82]/55" : "text-[#031F82]/30",
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

/** Full 12-month grid, hidden behind All challenges until expanded. */
export function MonthlyChallengesSection() {
  const [showAll, setShowAll] = useState(false);

  return (
    <section
      aria-labelledby="monthly-challenges-heading"
      className="w-full shrink-0"
    >
      <h2 id="monthly-challenges-heading" className="sr-only">
        Monthly Challenges
      </h2>
      <button
        type="button"
        aria-expanded={showAll}
        aria-controls="all-monthly-challenges"
        onClick={() => setShowAll((open) => !open)}
        className="flex w-full items-center justify-between rounded-nga-lg border border-nga-panel bg-nga-surface px-3 py-2 font-heading text-xs font-bold uppercase tracking-wide text-nga-primary"
      >
        All challenges
        <span aria-hidden className="text-nga-secondary">
          {showAll ? "-" : "+"}
        </span>
      </button>
      {showAll ? (
        <div id="all-monthly-challenges">
          <p className="mt-2 text-center font-sans text-[10px] leading-snug text-nga-slate/80">
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
        </div>
      ) : null}
    </section>
  );
}
