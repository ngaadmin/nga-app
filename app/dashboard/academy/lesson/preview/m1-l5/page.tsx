import type { Metadata } from "next";
import { AcademyLessonPlayer } from "@/components/academy/lesson/academy-lesson-player";
import { M1L5CohortPreviewBar } from "@/components/academy/lesson/dev/m1-l5-cohort-preview-bar";
import { SearchParamsBoundary } from "@/components/ui/search-params-boundary";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Module 1 Lesson 5 Preview",
  description:
    "Dev / QA only — local preview of Module 1 Lesson 5 with Explorer, Pathfinder, and Maverick copy.",
};

/** Dev / QA route — not linked from the Academy map or production nav. */
export default function M1L5LocalPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-white">
      <SearchParamsBoundary>
        <M1L5CohortPreviewBar />
      </SearchParamsBoundary>
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col bg-white">
        <AcademyLessonPlayer milestoneId={5} forcePreview />
      </div>
    </div>
  );
}
