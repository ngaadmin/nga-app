import type { Metadata } from "next";
import { LessonCompletionScreenPreview } from "@/components/academy/lesson/dev/lesson-completion-screen-preview";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Screen 8 Preview",
  description: "Dev / QA only — standalone preview of the lesson completion screen.",
};

/** Dev / QA route — not linked from production nav or lesson flow. */
export default function TestScreen8Page() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white">
      <LessonCompletionScreenPreview />
    </main>
  );
}
