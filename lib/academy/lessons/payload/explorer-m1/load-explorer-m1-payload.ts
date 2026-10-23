import { readFileSync } from "node:fs";
import path from "node:path";

import type { LessonPayload } from "@/lib/academy/lessons/payload/types";

const LESSONS_PATH = path.join(
  process.cwd(),
  "lib/academy/lessons/payload/source/explorer-m1/lessons.json",
);

let cached: LessonPayload[] | null = null;

function readLessons(): LessonPayload[] {
  if (cached) return cached;
  const parsed = JSON.parse(readFileSync(LESSONS_PATH, "utf8")) as {
    lessons?: LessonPayload[];
  };
  cached = parsed.lessons ?? [];
  return cached;
}

/** Generated Explorer Module 1 lesson. Undefined when that lesson was not imported. */
export function loadExplorerM1Payload(lessonNumber: number): LessonPayload | undefined {
  return readLessons().find((lesson) => lesson.lessonNumber === lessonNumber);
}
