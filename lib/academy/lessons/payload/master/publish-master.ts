import type { LessonPayload } from "@/lib/academy/lessons/payload/types";
import type { MasterModule, MasterRowIssue } from "@/lib/academy/lessons/payload/master/read-master";
import { MASTER_PAYLOAD_SCHEMA_VERSION } from "@/lib/academy/lessons/payload/master/schema-version";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

const COHORTS: readonly MasteryCohort[] = ["explorer", "pathfinder", "maverick"];

/** What one academy_lesson_versions row stores in `payload`. */
export type MasterPublishPayload = {
  schemaVersion: typeof MASTER_PAYLOAD_SCHEMA_VERSION;
  moduleNumber: number;
  mediaBase: string;
  /**
   * Every bucket object the lessons name. `pending` lists objects that were
   * not in the bucket when this draft was stored (held Lars art only). A
   * version with anything pending can't be promoted.
   */
  media: { images: string[]; audio: string[]; pending?: string[] };
  explorer: LessonPayload[];
  pathfinder: LessonPayload[];
  maverick: LessonPayload[];
};

export function buildMasterPublishPayload(
  module: MasterModule,
  pending: readonly string[] = [],
): MasterPublishPayload {
  return {
    schemaVersion: MASTER_PAYLOAD_SCHEMA_VERSION,
    moduleNumber: module.moduleNumber,
    mediaBase: module.mediaBase,
    media: pending.length > 0 ? { ...module.media, pending: [...pending].sort() } : module.media,
    explorer: module.byCohort.explorer,
    pathfinder: module.byCohort.pathfinder,
    maverick: module.byCohort.maverick,
  };
}

export type PayloadCheck = { ok: true; payload: MasterPublishPayload } | { ok: false; reason: string };

/**
 * Shape check used at publish and again when a lesson page reads a version.
 * An unknown schemaVersion is rejected so an old app never plays a newer shape.
 */
export function checkMasterPublishPayload(
  value: unknown,
  expectedModule?: number,
): PayloadCheck {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, reason: "Payload is not an object." };
  }
  const payload = value as Record<string, unknown>;
  if (payload.schemaVersion !== MASTER_PAYLOAD_SCHEMA_VERSION) {
    return { ok: false, reason: `Unsupported schemaVersion ${String(payload.schemaVersion)}.` };
  }
  const moduleNumber = payload.moduleNumber;
  if (typeof moduleNumber !== "number" || !Number.isInteger(moduleNumber) || moduleNumber < 1) {
    return { ok: false, reason: "moduleNumber is missing." };
  }
  if (expectedModule !== undefined && moduleNumber !== expectedModule) {
    return { ok: false, reason: `Payload is module ${moduleNumber}, expected ${expectedModule}.` };
  }
  if (typeof payload.mediaBase !== "string" || !payload.mediaBase) {
    return { ok: false, reason: "mediaBase is missing." };
  }
  const media = payload.media as Record<string, unknown> | undefined;
  if (!media || !Array.isArray(media.images) || !Array.isArray(media.audio)) {
    return { ok: false, reason: "media manifest is missing." };
  }
  if (media.pending !== undefined && !Array.isArray(media.pending)) {
    return { ok: false, reason: "media.pending must be a list." };
  }
  for (const cohort of COHORTS) {
    const lessons = payload[cohort];
    if (!Array.isArray(lessons)) return { ok: false, reason: `${cohort} lessons are missing.` };
    const numbers = new Set<number>();
    for (const lesson of lessons) {
      if (!isLessonPayload(lesson)) return { ok: false, reason: `${cohort} has a malformed lesson.` };
      if (lesson.moduleNumber !== moduleNumber) {
        return { ok: false, reason: `${cohort} lesson ${lesson.lessonNumber} is in another module.` };
      }
      numbers.add(lesson.lessonNumber);
    }
    for (let lessonNumber = 1; lessonNumber <= 9; lessonNumber += 1) {
      if (!numbers.has(lessonNumber)) {
        return { ok: false, reason: `${cohort} lesson ${lessonNumber} is missing.` };
      }
    }
    if (numbers.size !== 9) return { ok: false, reason: `${cohort} must have exactly 9 lessons.` };
  }
  return { ok: true, payload: value as MasterPublishPayload };
}

function isLessonPayload(value: unknown): value is LessonPayload {
  if (!value || typeof value !== "object") return false;
  const lesson = value as LessonPayload;
  return (
    typeof lesson.lessonNumber === "number" &&
    typeof lesson.moduleNumber === "number" &&
    typeof lesson.lessonTitle === "string" &&
    Array.isArray(lesson.screens)
  );
}

/**
 * Progress is keyed by lesson number, so a lesson must not move.
 * A title that was lesson N in the last version and now sits at another
 * number blocks the publish.
 */
export function renumberedLessons(
  previous: MasterPublishPayload | null,
  next: MasterPublishPayload,
): string[] {
  if (!previous) return [];
  const problems: string[] = [];
  for (const cohort of COHORTS) {
    const before = new Map(previous[cohort].map((lesson) => [normalTitle(lesson.lessonTitle), lesson.lessonNumber]));
    for (const lesson of next[cohort]) {
      const was = before.get(normalTitle(lesson.lessonTitle));
      if (was !== undefined && was !== lesson.lessonNumber) {
        problems.push(`${cohort} "${lesson.lessonTitle}" moved from lesson ${was} to ${lesson.lessonNumber}.`);
      }
    }
  }
  return problems;
}

function normalTitle(title: string): string {
  return title.trim().toLowerCase();
}

export type MasterPublishStore = {
  /** Id of a stored version of this module with this hash, or null. Hashes are unique per module. */
  findByHash: (hash: string) => Promise<string | null>;
  /** Insert a draft version. Never moves the current pointer. Returns the new id. */
  saveDraft: (hash: string, payload: MasterPublishPayload) => Promise<string>;
};

export type MasterPublishResult = {
  ok: boolean;
  wrote: boolean;
  versionId?: string;
  issues: MasterRowIssue[];
  blocked: string[];
};

/**
 * Reasons a stored version can't become current. Anything listed here means
 * learners would see a placeholder, so promote refuses.
 */
export function promotionBlockers(value: unknown, expectedModule?: number): string[] {
  const check = checkMasterPublishPayload(value, expectedModule);
  if (!check.ok) return [check.reason];
  const pending = check.payload.media.pending ?? [];
  return pending.map((object) => `Not in the bucket yet: ${object}`);
}

export type MasterDraftOptions = {
  previous?: MasterPublishPayload | null;
  store?: MasterPublishStore;
  /**
   * Missing objects this returns true for are stored as `media.pending`
   * instead of blocking the draft. Used only for the held Lars art so the
   * preview can be reviewed before Jasper's OK. Promote still refuses them.
   */
  allowPending?: (objectPath: string) => boolean;
};

/**
 * Store a draft. A bad row, a missing picture or clip, or a renumbered lesson
 * publishes nothing. The same hash as the newest version does not insert again.
 * Promoting a draft to current is a separate, explicit step.
 */
export async function publishMasterDraft(
  module: MasterModule,
  options: MasterDraftOptions = {},
): Promise<MasterPublishResult & { pending: string[] }> {
  if (module.issues.length > 0 || !module.contentHash) {
    return { ok: false, wrote: false, issues: module.issues, blocked: [], pending: [] };
  }
  const blocked: string[] = [];
  const pending = new Set<string>();
  for (const item of module.missing) {
    const objectPath = `${item.kind === "audio" ? "audio" : "images"}/${item.name}`;
    if (options.allowPending?.(objectPath) && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(item.name)) {
      pending.add(objectPath);
      continue;
    }
    blocked.push(`${item.sheet} row ${item.row}: missing ${item.kind} ${item.name}`);
  }
  const payload = buildMasterPublishPayload(module, [...pending]);
  const check = checkMasterPublishPayload(payload, module.moduleNumber);
  if (!check.ok) blocked.push(check.reason);
  blocked.push(...renumberedLessons(options.previous ?? null, payload));
  const pendingList = payload.media.pending ?? [];
  if (blocked.length > 0) {
    return { ok: false, wrote: false, issues: [], blocked, pending: pendingList };
  }
  if (!options.store) return { ok: true, wrote: false, issues: [], blocked: [], pending: pendingList };
  // The hash covers the workbook and the pending list, so uploading the held
  // art later and publishing again stores a fresh, promotable version.
  const hash = pendingList.length > 0
    ? `${module.contentHash}+pending:${pendingList.length}`
    : module.contentHash;
  const existing = await options.store.findByHash(hash);
  if (existing) {
    return { ok: true, wrote: false, versionId: existing, issues: [], blocked: [], pending: pendingList };
  }
  const versionId = await options.store.saveDraft(hash, payload);
  return { ok: true, wrote: true, versionId, issues: [], blocked: [], pending: pendingList };
}
