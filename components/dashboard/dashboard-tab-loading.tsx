import { LessonCoinRunMeter } from "@/components/academy/lesson/lesson-coin-run-meter";

/**
 * Instant placeholder for a dashboard tab while its route payload is in flight.
 * Uses the same pulse treatment as the Class loading state.
 */
export function DashboardTabLoading() {
  return (
    <div
      className="mx-auto w-full max-w-md"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Opening</span>
      <div className="h-8 w-44 animate-pulse rounded-full bg-[#EAF0FF]" />
      <div className="mt-3 h-4 w-64 max-w-full animate-pulse rounded-full bg-[#E1E8F6]" />
      <div className="mt-6 h-28 animate-pulse rounded-2xl bg-[#EAF0FF]/70" />
      <div className="mt-4 h-28 animate-pulse rounded-2xl bg-[#EAF0FF]/40" />
    </div>
  );
}

/** Same coin meter the lesson route shows while its payload is in flight. */
export function DashboardLessonOpening() {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col bg-white">
      <header className="lesson-screen-inline flex shrink-0 items-center gap-2.5 pb-1 pt-3.5">
        <LessonCoinRunMeter streak={0} />
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8F6FC]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          aria-label="Lesson loading"
        />
      </header>
      <div className="min-h-0 flex-1" aria-live="polite">
        <span className="sr-only">Opening lesson</span>
      </div>
    </div>
  );
}
