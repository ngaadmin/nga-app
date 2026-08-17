"use client";

import { useMemo } from "react";
import { LearningStreaksSection } from "@/components/dashboard/learning-streaks-section";
import { copyMatrix } from "@/constants/copyMatrix";
import { SnowflakeIcon } from "@/lib/dashboard/icons";
import {
  buildPracticeCalendar,
  type PracticeCalendarDay,
} from "@/lib/dashboard/streak-practice";
import { cn } from "@/lib/utils/cn";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const MIN_FREEZE_SLOTS = 2;

type LearningStreaksPanelProps = {
  dayStreak: number;
  streakFreezes: number;
};

function SectionLabel({
  id,
  children,
}: {
  id: string;
  children: string;
}) {
  return (
    <h3 id={id} className="font-heading text-sm font-extrabold text-[#031F82]">
      {children}
    </h3>
  );
}

function StreakFreezesGlance({ count }: { count: number }) {
  const slots = Math.max(MIN_FREEZE_SLOTS, count);
  const readyLabel = count === 1 ? "freeze ready" : "freezes ready";

  return (
    <div className="mt-2 flex items-center gap-4 rounded-2xl bg-[#F7FBFF] px-4 py-3">
      <div className="flex shrink-0 gap-2" aria-hidden>
        {Array.from({ length: slots }, (_, index) => {
          const filled = index < count;
          return (
            <span
              key={index}
              className={cn(
                "flex size-11 items-center justify-center rounded-full",
                filled
                  ? "bg-[#0CC1E0] text-white shadow-[0_3px_8px_rgba(12,193,224,0.35)]"
                  : "border-2 border-dashed border-[#C5D0D8] bg-white text-[#C5D0D8]",
              )}
            >
              <SnowflakeIcon className="size-5" />
            </span>
          );
        })}
      </div>
      <div className="min-w-0">
        <p className="font-heading text-xl font-extrabold leading-none tabular-nums text-[#031F82]">
          {count}
          <span className="ml-1.5 text-sm font-bold text-[#8FA3B0]">
            {readyLabel}
          </span>
        </p>
        <p className="mt-1 font-sans text-[11px] leading-snug text-[#1E3A5F]/80">
          Miss a day? A freeze keeps your streak going.
        </p>
      </div>
    </div>
  );
}

function calendarDayLabel(day: PracticeCalendarDay): string {
  if (day.isFuture) return `Day ${day.dayOfMonth}, upcoming`;
  if (day.practiced && day.isToday) {
    return `Day ${day.dayOfMonth}, practiced today`;
  }
  if (day.practiced) return `Day ${day.dayOfMonth}, practiced`;
  if (day.isToday) return `Day ${day.dayOfMonth}, today — not practiced yet`;
  return `Day ${day.dayOfMonth}, no practice`;
}

function PracticeCalendar({ dayStreak }: { dayStreak: number }) {
  const model = useMemo(
    () => buildPracticeCalendar(new Date(), dayStreak),
    [dayStreak],
  );

  return (
    <div className="mt-2 rounded-2xl bg-[#F7FBFF] px-3 py-3">
      <p className="mb-2 text-center font-heading text-[11px] font-bold text-[#8FA3B0]">
        {model.rangeLabel}
      </p>
      <div
        aria-label="Days practiced in the last four weeks"
        className="grid grid-cols-7 gap-y-2"
      >
        {WEEKDAY_LABELS.map((label, index) => (
          <span
            key={`${label}-${index}`}
            className="text-center font-heading text-[10px] font-bold text-[#8FA3B0]"
          >
            {label}
          </span>
        ))}
        {model.days.map((day) => (
          <span
            key={day.key}
            aria-label={calendarDayLabel(day)}
            className="flex items-center justify-center"
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full font-heading text-[11px] font-bold tabular-nums",
                day.isFuture && "text-[#C5D0D8]",
                !day.isFuture &&
                  !day.practiced &&
                  !day.isToday &&
                  "text-[#8FA3B0]",
                day.practiced &&
                  "bg-[#FFA503] text-[#031F82] shadow-[0_2px_6px_rgba(255,165,3,0.35)]",
                day.isToday &&
                  !day.practiced &&
                  "border-2 border-[#031F82] text-[#031F82]",
                day.isToday &&
                  day.practiced &&
                  "ring-2 ring-[#031F82] ring-offset-1",
              )}
            >
              {day.dayOfMonth}
            </span>
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 font-sans text-[10px] text-[#8FA3B0]">
        <span className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full bg-[#FFA503]"
            aria-hidden
          />
          Practiced
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full border-2 border-[#031F82]"
            aria-hidden
          />
          Today
        </span>
      </div>
    </div>
  );
}

/** Full-height Learning Streaks body: counter, freezes, calendar, then badges. */
export function LearningStreaksPanel({
  dayStreak,
  streakFreezes,
}: LearningStreaksPanelProps) {
  const streakCopy = copyMatrix.home.streak;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <p className="text-center font-heading text-3xl font-extrabold tabular-nums text-[#031F82]">
        {dayStreak}
        <span className="ml-1 text-sm font-bold text-[#8FA3B0]">
          {streakCopy.unit}
        </span>
      </p>

      <section aria-labelledby="streak-freezes-heading">
        <SectionLabel id="streak-freezes-heading">Streak Freezes</SectionLabel>
        <StreakFreezesGlance count={streakFreezes} />
      </section>

      <section aria-labelledby="practice-calendar-heading">
        <SectionLabel id="practice-calendar-heading">
          Practice calendar
        </SectionLabel>
        <PracticeCalendar dayStreak={dayStreak} />
      </section>

      <section aria-labelledby="streak-milestones-heading">
        <SectionLabel id="streak-milestones-heading">
          Streak milestones
        </SectionLabel>
        <LearningStreaksSection hideHeading />
      </section>
    </div>
  );
}
