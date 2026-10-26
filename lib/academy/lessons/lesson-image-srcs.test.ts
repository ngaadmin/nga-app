import { describe, expect, it } from "vitest";
import { loadExplorerM1Payload } from "@/lib/academy/lessons/payload/explorer-m1/load-explorer-m1-payload";
import { selectLessonPayload } from "@/lib/academy/lessons/payload/explorer-m1/select-payload";
import { loadBundledLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import { lessonImageSrcs } from "@/lib/academy/lessons/lesson-image-srcs";
import { resolveLessonScreenIllustration } from "@/lib/academy/lessons/resolve-lesson-screen-illustration";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import nextConfig from "../../../next.config";

function playedLesson(cohort: MasteryCohort, lessonNumber: number) {
  const bundled = loadBundledLessonPayload(1, lessonNumber);
  const explorer = loadExplorerM1Payload(lessonNumber);
  const payload = selectLessonPayload(cohort, bundled, explorer);
  if (!payload) throw new Error(`${cohort} lesson ${lessonNumber} is missing`);
  return resolvePayloadLesson(payload, cohort, lessonNumber);
}

describe("lessonImageSrcs", () => {
  it("includes a later screen's scene art when the lesson opens", () => {
    const checks: Array<{ cohort: MasteryCohort; lesson: number; screen: number }> = [
      { cohort: "explorer", lesson: 1, screen: 9 },
      { cohort: "pathfinder", lesson: 1, screen: 6 },
      { cohort: "maverick", lesson: 1, screen: 2 },
    ];

    for (const check of checks) {
      const lesson = playedLesson(check.cohort, check.lesson);
      const screen = lesson.screens[check.screen - 1];
      const src = screen ? resolveLessonScreenIllustration(screen)?.src : undefined;
      expect(src, `${check.cohort} L${check.lesson} screen ${check.screen}`).toBeTruthy();
      const listed = lessonImageSrcs(lesson.screens, lesson.characterName);
      expect(listed, `${check.cohort} L${check.lesson}`).toContain(src);
      expect(listed.length).toBeGreaterThan(1);
      expect(new Set(listed).size).toBe(listed.length);
    }
  });

  it("includes the Maverick lesson 1 closing beat", () => {
    const lesson = playedLesson("maverick", 1);
    const closing = [...lesson.screens].reverse().find((screen) => {
      return screen.type === "narrative-bonus" && Boolean(resolveLessonScreenIllustration(screen)?.src);
    });
    const src = closing ? resolveLessonScreenIllustration(closing)?.src : undefined;
    expect(src).toBeTruthy();
    expect(lessonImageSrcs(lesson.screens, lesson.characterName)).toContain(src);
  });
});

describe("illustration cache header", () => {
  it("keeps lesson WebPs cached for a year", async () => {
    const rules = await nextConfig.headers?.();
    const illustration = rules?.find((rule) => rule.source === "/assets/illustrations/:path*");
    expect(illustration?.headers).toEqual([
      { key: "Cache-Control", value: "public, max-age=31536000" },
    ]);
  });
});
