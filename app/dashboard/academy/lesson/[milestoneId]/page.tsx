import type { Metadata } from "next";
import { AcademyLessonPlayer } from "@/components/academy/lesson/academy-lesson-player";
import { loadBundledLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { assertLessonPayloadAssets } from "@/lib/academy/lessons/payload/validate-lesson-assets";
import {
  bundledPayloadMilestone,
  hasShippedLesson,
} from "@/lib/academy/lessons/registry";
import {
  lessonNumberForMilestoneId,
  levelGroupForMilestoneId,
} from "@/lib/dashboard/academy-state";
import { allowsDirectLessonOpen } from "@/lib/dev/academy-dev-tools";
import { notFound } from "next/navigation";

type AcademyLessonPageProps = {
  params: Promise<{ milestoneId: string }>;
  searchParams: Promise<{ preview?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Academy Lesson",
};

export default async function AcademyLessonPage({
  params,
  searchParams,
}: AcademyLessonPageProps) {
  const { milestoneId } = await params;
  const query = await searchParams;
  const previewValue = Array.isArray(query.preview) ? query.preview[0] : query.preview;
  const parsedId = Number.parseInt(milestoneId, 10);
  const directOpen = allowsDirectLessonOpen({ preview: previewValue === "1" });

  if (!Number.isFinite(parsedId) || parsedId < 1) {
    notFound();
  }

  if (!hasShippedLesson(parsedId) && !directOpen) {
    notFound();
  }

  const bundled = bundledPayloadMilestone(parsedId);
  const payload = bundled
    ? loadBundledLessonPayload(bundled.moduleNumber, bundled.lessonNumber)
    : directOpen
      ? loadUnshippedLessonPayload(parsedId)
      : undefined;

  if (payload) {
    assertLessonPayloadAssets(payload, parsedId);
  }

  if (!hasShippedLesson(parsedId) && !payload) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col bg-white">
      <AcademyLessonPlayer milestoneId={parsedId} payload={payload} />
    </div>
  );
}

/** Sheet lesson for a milestone that has no hard-coded file. Missing rows 404. */
function loadUnshippedLessonPayload(milestoneId: number) {
  try {
    return loadBundledLessonPayload(
      levelGroupForMilestoneId(milestoneId),
      lessonNumberForMilestoneId(milestoneId),
    );
  } catch (error) {
    if (
      error instanceof Error &&
      /No (lesson details|screens) for module/.test(error.message)
    ) {
      return undefined;
    }
    throw error;
  }
}
