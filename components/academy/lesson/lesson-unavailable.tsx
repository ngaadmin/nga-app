import Link from "next/link";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/guest-session";

/**
 * Shown when a lesson cannot be read and this server has no earlier copy.
 * Progress is untouched. The learner can retry or go back to the map.
 */
export function LessonUnavailable({ milestoneId }: { milestoneId: number }) {
  return (
    <div
      className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col items-center justify-center gap-5 bg-white px-6 py-12 text-center"
      data-testid="academy-lesson-unavailable"
      role="alert"
    >
      <div aria-hidden className="text-5xl">
        🛠️
      </div>
      <h1 className="font-heading text-[22px] font-extrabold text-[#031F82]">
        This lesson can&apos;t load right now
      </h1>
      <p className="text-[15px] leading-snug text-[#3B4A7A]">
        Your progress is safe. Check your connection and try again in a minute.
      </p>
      <div className="flex w-full flex-col gap-3">
        <a
          href={`/dashboard/academy/lesson/${milestoneId}`}
          className="flex h-[52px] w-full items-center justify-center rounded-full bg-[#FFA503] font-heading text-[17px] font-extrabold text-[#031F82] shadow-[0_5px_0_#C88202]"
        >
          Try again
        </a>
        <Link
          href={DASHBOARD_ACADEMY_PATH}
          className="flex h-[52px] w-full items-center justify-center rounded-full border-2 border-[#031F82] font-heading text-[17px] font-extrabold text-[#031F82]"
        >
          Back to the Academy
        </Link>
      </div>
    </div>
  );
}
