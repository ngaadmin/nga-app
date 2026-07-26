import type { Metadata } from "next";
import { AcademyLessonPlayer } from "@/components/academy/lesson/academy-lesson-player";
import { DESIGN_SHELL_MILESTONE_ID } from "@/lib/academy/lessons/registry";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Academy Design Shell",
  description: "Dev / QA only — visual and interaction QA for Academy lesson screen types.",
};

/** Dev / QA route — not linked from the Academy map or production nav. */
export default function AcademyDesignShellPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col bg-white">
      <AcademyLessonPlayer milestoneId={DESIGN_SHELL_MILESTONE_ID} />
    </div>
  );
}
