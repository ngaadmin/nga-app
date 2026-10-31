import type { Metadata } from "next";
import { connection } from "next/server";
import { AcademyLessonPlayer } from "@/components/academy/lesson/academy-lesson-player";
import { loadExplorerM1Payload } from "@/lib/academy/lessons/payload/explorer-m1/load-explorer-m1-payload";
import { loadBundledLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { academyMasterPayloadEnabled } from "@/lib/academy/lessons/payload/master/master-flag";
import { academyLessonLog, loadMasterLessonTrio } from "@/lib/academy/lessons/payload/master/fetch-published";
import { ACADEMY_DB_LESSON_MODULES } from "@/lib/academy/lessons/payload/master/schema-version";
import { LessonUnavailable } from "@/components/academy/lesson/lesson-unavailable";
import { assertLessonPayloadAssets } from "@/lib/academy/lessons/payload/validate-lesson-assets";
import {
  bundledPayloadMilestone,
  hasShippedLesson,
  listPlayableLessonMilestoneIds,
} from "@/lib/academy/lessons/lesson-availability";
import {
  lessonNumberForMilestoneId,
  levelGroupForMilestoneId,
} from "@/lib/dashboard/academy-state";
import { allowsDirectLessonOpen } from "@/lib/dev/academy-dev-tools";
import { notFound } from "next/navigation";

type AcademyLessonPageProps = {
  params: Promise<{ milestoneId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Academy Lesson",
};

export function generateStaticParams() {
  return listPlayableLessonMilestoneIds().map((milestoneId) => ({
    milestoneId: String(milestoneId),
  }));
}

export default async function AcademyLessonPage({
  params,
  searchParams,
}: AcademyLessonPageProps) {
  const { milestoneId } = await params;
  const parsedId = Number.parseInt(milestoneId, 10);
  const directOpen = allowsDirectLessonOpen();

  if (!Number.isFinite(parsedId) || parsedId < 1) {
    notFound();
  }

  if (!hasShippedLesson(parsedId) && !directOpen) {
    notFound();
  }

  const bundled = bundledPayloadMilestone(parsedId);
  if (
    academyMasterPayloadEnabled() &&
    bundled &&
    ACADEMY_DB_LESSON_MODULES.includes(bundled.moduleNumber)
  ) {
    await connection();
    const query = (await searchParams) ?? {};
    const draft = typeof query.draft === "string" ? query.draft : undefined;
    const loaded = await loadMasterLessonTrio(bundled.moduleNumber, bundled.lessonNumber, { draft });
    if (!loaded.ok) {
      return <LessonUnavailable milestoneId={parsedId} />;
    }
    const { trio } = loaded;
    try {
      // GO targets and screen shapes only. Pictures were checked at publish.
      for (const lesson of [trio.pathfinder, trio.explorer, trio.maverick]) {
        assertLessonPayloadAssets(lesson, parsedId, { pictures: "bucket" });
      }
    } catch (error) {
      academyLessonLog("academy_lesson_error_screen", {
        moduleNumber: bundled.moduleNumber,
        lessonNumber: bundled.lessonNumber,
        versionId: loaded.versionId,
        reason: error instanceof Error ? error.message.slice(0, 300) : "invalid lesson",
      });
      return <LessonUnavailable milestoneId={parsedId} />;
    }
    return (
      <div
        className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col bg-white"
        data-lesson-source={loaded.source}
        data-lesson-version={loaded.versionId}
      >
        <AcademyLessonPlayer
          milestoneId={parsedId}
          payload={trio.pathfinder}
          explorerPayload={trio.explorer}
          maverickPayload={trio.maverick}
          mediaBase={loaded.mediaBase}
        />
      </div>
    );
  }

  const payload = bundled
    ? loadBundledLessonPayload(bundled.moduleNumber, bundled.lessonNumber)
    : directOpen
      ? loadUnshippedLessonPayload(parsedId)
      : undefined;

  if (payload) {
    assertLessonPayloadAssets(payload, parsedId);
  }

  const explorerPayload =
    bundled?.moduleNumber === 1
      ? loadExplorerM1Payload(bundled.lessonNumber)
      : undefined;

  if (!hasShippedLesson(parsedId) && !payload) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col bg-white">
      <AcademyLessonPlayer
        milestoneId={parsedId}
        payload={payload}
        explorerPayload={explorerPayload}
      />
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
