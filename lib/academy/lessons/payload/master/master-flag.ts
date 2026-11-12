import { academyAudioUrl } from "@/lib/academy/media/academy-media";
import { ACADEMY_AUDIO_BASE_URL } from "@/lib/academy/lessons/story-audio/audio-base";
import explorerM1Manifest from "@/lib/academy/lessons/payload/source/explorer-m1/manifest.json";
import { ACADEMY_DB_LESSON_MODULES } from "@/lib/academy/lessons/payload/master/schema-version";

/** Keys read at call time. Direct property access so Next inlines NEXT_PUBLIC_* in the browser. */
function academyPayloadProcessEnv(): Record<string, string | undefined> {
  return {
    ACADEMY_MASTER_PAYLOAD: process.env.ACADEMY_MASTER_PAYLOAD,
    NEXT_PUBLIC_ACADEMY_MASTER_PAYLOAD: process.env.NEXT_PUBLIC_ACADEMY_MASTER_PAYLOAD,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
  };
}

/**
 * Master-workbook flag.
 * Off unless this is a Vercel preview or the env var is explicitly on.
 * A false result in production is not a bundled-lesson path. Modules in
 * ACADEMY_DB_LESSON_MODULES still read the database there. Do not turn the
 * production flag off to serve Screens1.csv or lessons.json.
 */
export function academyMasterPayloadEnabled(
  env: Record<string, string | undefined> = academyPayloadProcessEnv(),
): boolean {
  const explicit = env.ACADEMY_MASTER_PAYLOAD ?? env.NEXT_PUBLIC_ACADEMY_MASTER_PAYLOAD;
  if (explicit === "1" || explicit === "true") return true;
  if (explicit === "0" || explicit === "false") return false;
  const vercel = env.NEXT_PUBLIC_VERCEL_ENV ?? env.VERCEL_ENV;
  return vercel === "preview";
}

/**
 * Production must read database-led Academy lessons from the database.
 * Either Vercel env being `production` counts. Unsetting the master-payload
 * flag does not turn this off.
 */
export function academyProductionRequiresDatabase(
  env: Record<string, string | undefined> = academyPayloadProcessEnv(),
): boolean {
  return env.VERCEL_ENV === "production" || env.NEXT_PUBLIC_VERCEL_ENV === "production";
}

/**
 * True when this module's lesson must be loaded from academy_lesson_versions.
 * Production always does, for ACADEMY_DB_LESSON_MODULES, even when the
 * master-payload flag is unset or "0". Anywhere else, the flag decides
 * (a Vercel preview defaults it on).
 */
export function academyLessonMustUseDatabase(
  moduleNumber: number,
  env: Record<string, string | undefined> = academyPayloadProcessEnv(),
): boolean {
  if (!ACADEMY_DB_LESSON_MODULES.includes(moduleNumber)) return false;
  if (academyProductionRequiresDatabase(env)) return true;
  return academyMasterPayloadEnabled(env);
}

/** Lesson 1 map tap clip names in the academy-media bucket. */
export const MASTER_LESSON_ONE_INTRO_FILE: Record<
  "explorer" | "pathfinder" | "maverick",
  string
> = {
  explorer: "explorer-m1-intro-beat1-3cb1a9a8.mp3",
  pathfinder: "pathfinder-m1-intro-beat1-8c287c65.mp3",
  maverick: "maverick-m1-intro-beat1-7b02bf77.mp3",
};

/**
 * Lesson 1 map tap. Production uses the academy-media clip for Module 1.
 * Outside production, flag off keeps the shipped Explorer clip.
 */
export function lessonOneMapIntroSrc(
  cohort: "explorer" | "pathfinder" | "maverick",
  env: Record<string, string | undefined> = academyPayloadProcessEnv(),
): string | undefined {
  if (!academyLessonMustUseDatabase(1, env)) {
    return cohort === "explorer" ? legacyExplorerIntro() : undefined;
  }
  // Storage only. No /public fallback for master lessons.
  return academyAudioUrl(MASTER_LESSON_ONE_INTRO_FILE[cohort]) || undefined;
}

function legacyExplorerIntro(): string | undefined {
  const intro = explorerM1Manifest.find((row) => row.beat_id === "explorer-m1-intro-beat1");
  return intro ? `${ACADEMY_AUDIO_BASE_URL}/${intro.file}` : undefined;
}
