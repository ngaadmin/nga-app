import { lessonScreenInlinePaddingClass } from "@/components/academy/lesson/lesson-shared-styles";
import { cn } from "@/lib/utils/cn";

const LESSON_LOADING_LIVES = 4;

/** Shown the moment a lesson tile is tapped, before the lesson payload arrives. */
export default function AcademyLessonLoading() {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col bg-white">
      <header
        className={cn(
          "flex shrink-0 items-center gap-2.5 pb-1 pt-3.5",
          lessonScreenInlinePaddingClass,
        )}
      >
        <div className="flex shrink-0 items-center gap-0.5" aria-hidden>
          {Array.from({ length: LESSON_LOADING_LIVES }, (_, index) => (
            <span key={index} className="text-[14px] leading-none">
              ❤️
            </span>
          ))}
        </div>
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
