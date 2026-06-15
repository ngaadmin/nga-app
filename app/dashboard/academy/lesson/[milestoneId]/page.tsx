import type { Metadata } from "next";
import { M1L1Lesson } from "@/components/academy/lesson/m1-l1-lesson";
import { hasShippedLesson } from "@/lib/academy/lessons/registry";
import { notFound } from "next/navigation";

type AcademyLessonPageProps = {
  params: Promise<{ milestoneId: string }>;
};

export const metadata: Metadata = {
  title: "Academy Lesson",
};

export default async function AcademyLessonPage({ params }: AcademyLessonPageProps) {
  const { milestoneId } = await params;
  const parsedId = Number.parseInt(milestoneId, 10);

  if (!Number.isFinite(parsedId) || !hasShippedLesson(parsedId)) {
    notFound();
  }

  if (parsedId === 1) {
    return (
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col bg-white">
        <M1L1Lesson milestoneId={parsedId} />
      </div>
    );
  }

  notFound();
}
