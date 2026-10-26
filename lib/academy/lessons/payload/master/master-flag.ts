import { ACADEMY_AUDIO_BASE_URL } from "@/lib/academy/lessons/story-audio/audio-base";
import explorerM1Manifest from "@/lib/academy/lessons/payload/source/explorer-m1/manifest.json";

/**
 * Master-workbook lessons.
 * Off unless this is a Vercel preview or the env var is explicitly on.
 * Production stays on the bundled CSV / lessons.json path.
 */
export function academyMasterPayloadEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const explicit = env.ACADEMY_MASTER_PAYLOAD ?? env.NEXT_PUBLIC_ACADEMY_MASTER_PAYLOAD;
  if (explicit === "1" || explicit === "true") return true;
  if (explicit === "0" || explicit === "false") return false;
  const vercel = env.NEXT_PUBLIC_VERCEL_ENV ?? env.VERCEL_ENV;
  return vercel === "preview";
}

/** Lesson 1 map tap. The master names are not all on disk yet. */
export const MASTER_LESSON_ONE_INTRO_FILE: Record<
  "explorer" | "pathfinder" | "maverick",
  string
> = {
  explorer: "explorer-m1-intro-beat1-3cb1a9a8.mp3",
  pathfinder: "pathfinder-m1-intro-beat1-8c287c65.mp3",
  maverick: "maverick-m1-intro-beat1-7b02bf77.mp3",
};

/** Lesson 1 map tap. Flag off keeps the shipped Explorer clip. */
export function lessonOneMapIntroSrc(
  cohort: "explorer" | "pathfinder" | "maverick",
): string | undefined {
  if (!academyMasterPayloadEnabled()) {
    return cohort === "explorer" ? legacyExplorerIntro() : undefined;
  }
  const file = MASTER_LESSON_ONE_INTRO_FILE[cohort];
  const base = process.env.NEXT_PUBLIC_ACADEMY_MEDIA_BASE?.trim().replace(/\/$/, "");
  if (base) return `${base}/audio/${encodeURIComponent(file)}`;
  return `/academy-audio/${cohort}-m1/${file}`;
}

function legacyExplorerIntro(): string | undefined {
  const intro = explorerM1Manifest.find((row) => row.beat_id === "explorer-m1-intro-beat1");
  return intro ? `${ACADEMY_AUDIO_BASE_URL}/${intro.file}` : undefined;
}
