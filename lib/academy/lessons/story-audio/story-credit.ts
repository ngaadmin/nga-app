import { STORY_CREDIT } from "@/lib/academy/lessons/story-audio/audio-base";

/** Lesson number inside `explorer-m1-l<N>-beatX`. */
export function lessonNumberFromBeatId(beatId: string): number | null {
  const match = /-l(\d+)-beat/i.exec(beatId.trim());
  if (!match) return null;
  const lesson = Number(match[1]);
  return Number.isFinite(lesson) ? lesson : null;
}

/**
 * First voiced beat of each lesson, in the order the beats are given.
 * Later beats in that lesson, including ones attached after completion,
 * do not get the credit.
 */
export function storyCreditBeatIds(
  beats: readonly { beatId: string; voiced: boolean }[],
): Set<string> {
  const seenLessons = new Set<number>();
  const credited = new Set<string>();
  for (const beat of beats) {
    if (!beat.voiced) continue;
    const lesson = lessonNumberFromBeatId(beat.beatId);
    if (lesson === null || seenLessons.has(lesson)) continue;
    seenLessons.add(lesson);
    credited.add(beat.beatId);
  }
  return credited;
}

export function storyCreditLine(beatId: string, credited: ReadonlySet<string>): string | undefined {
  return credited.has(beatId) ? STORY_CREDIT : undefined;
}
