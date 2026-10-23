import { STORY_CREDIT } from "@/lib/academy/lessons/story-audio/audio-base";

/** Lesson number inside `explorer-m1-l<N>-beatX`. A module intro counts as lesson 1. */
export function lessonNumberFromBeatId(beatId: string): number | null {
  const id = beatId.trim();
  const match = /-l(\d+)-beat/i.exec(id);
  if (match) {
    const lesson = Number(match[1]);
    return Number.isFinite(lesson) ? lesson : null;
  }
  if (/-intro-beat/i.test(id)) return 1;
  return null;
}

function introBeforeLessonBeat(leftId: string, rightId: string): number {
  const leftLesson = lessonNumberFromBeatId(leftId);
  const rightLesson = lessonNumberFromBeatId(rightId);
  if (leftLesson === null || leftLesson !== rightLesson) return 0;
  const leftIntro = /-intro-beat/i.test(leftId);
  const rightIntro = /-intro-beat/i.test(rightId);
  if (leftIntro === rightIntro) return 0;
  return leftIntro ? -1 : 1;
}

/**
 * First voiced beat of each lesson. The module intro counts as lesson 1,
 * so a later beat in that lesson does not get a second credit.
 * Beats attached after completion stay uncredited.
 */
export function storyCreditBeatIds(
  beats: readonly { beatId: string; voiced: boolean }[],
): Set<string> {
  const ordered = [...beats].sort((left, right) =>
    introBeforeLessonBeat(left.beatId, right.beatId),
  );
  const seenLessons = new Set<number>();
  const credited = new Set<string>();
  for (const beat of ordered) {
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
