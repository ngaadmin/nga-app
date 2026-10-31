/**
 * Preview-only build step. Uploads the lesson media a module names (held Lars
 * art only from the approved release manifest) and stores the workbook as a draft version, so a preview can
 * be reviewed with no secret leaving Vercel.
 *
 * Runs only when all of these hold, and does nothing otherwise:
 *   VERCEL_ENV=preview, ACADEMY_PREVIEW_JOB=1 (set for one branch only),
 *   and the branch is in ACADEMY_PREVIEW_JOB_BRANCHES.
 * Never writes academy_lesson_current. Never fails the build: a problem logs
 * ACADEMY_JOB_FAILED and the build goes on. Keys are never printed.
 */
import { publishMasterDraft } from "@/lib/academy/lessons/payload/master/publish-master";
import { MASTER_WORKBOOK_PATH, readMasterWorkbookFile } from "@/lib/academy/lessons/payload/master/read-master";
import { ACADEMY_DB_LESSON_MODULES } from "@/lib/academy/lessons/payload/master/schema-version";
import { currentPayload, restVersionStore } from "@/lib/academy/lessons/payload/master/version-store";
import { isHeldLarsMedia } from "@/lib/academy/media/held-media";
import {
  holdAllLars,
  type LarsReleasePlan,
  md5Of,
  planLarsRelease,
  readLarsReleaseManifest,
} from "@/lib/academy/media/lars-release";
import {
  headPublicObjects,
  publicObjectUrl,
  knownMediaFrom,
  planMediaUploads,
  uploadPlannedMedia,
} from "@/lib/academy/media/media-sync";

const ACADEMY_PREVIEW_JOB_BRANCHES = ["cursor/stage2-unwind-lesson-files-999a"];

function log(event: string, detail: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ event, ...detail }));
}

type PublicGet = { objectPath: string; status: number; md5?: string; cacheControl?: string };

async function getPublic(supabaseUrl: string, objectPath: string): Promise<PublicGet> {
  try {
    const response = await fetch(publicObjectUrl(supabaseUrl, objectPath), { cache: "no-store" });
    if (response.status !== 200) return { objectPath, status: response.status };
    return {
      objectPath,
      status: 200,
      md5: md5Of(Buffer.from(await response.arrayBuffer())),
      cacheControl: response.headers.get("cache-control") ?? undefined,
    };
  } catch {
    return { objectPath, status: 0 };
  }
}

/**
 * Stop the Lars release if any released name already holds other bytes, or
 * can't be checked. The same approved bytes already there are fine (a rerun).
 */
async function larsCollisions(
  supabaseUrl: string,
  release: LarsReleasePlan,
  approvedMd5: (objectPath: string) => string | undefined,
): Promise<string[]> {
  const problems: string[] = [];
  for (const objectPath of release.released) {
    const found = await getPublic(supabaseUrl, objectPath);
    if (found.status === 0) problems.push(`${objectPath}: could not check the bucket`);
    else if (found.status === 200 && found.md5 !== approvedMd5(objectPath))
      problems.push(`${objectPath}: name already used by other bytes`);
  }
  return problems;
}

async function run(): Promise<void> {
  const branch = process.env.VERCEL_GIT_COMMIT_REF ?? "";
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.ACADEMY_PREVIEW_JOB !== "1" ||
    !ACADEMY_PREVIEW_JOB_BRANCHES.includes(branch)
  ) {
    log("academy_preview_job_skipped");
    return;
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!supabaseUrl || !serviceKey) {
    log("ACADEMY_JOB_FAILED", { reason: "Supabase URL or service key is not set for this build." });
    return;
  }
  const credentials = { supabaseUrl, serviceKey };
  for (const moduleNumber of ACADEMY_DB_LESSON_MODULES) {
    const master = readMasterWorkbookFile(MASTER_WORKBOOK_PATH, { moduleNumber });
    if (master.issues.length > 0) {
      log("ACADEMY_JOB_FAILED", { moduleNumber, issues: master.issues.slice(0, 20) });
      continue;
    }
    const objects = [...master.media.images, ...master.media.audio];
    const manifest = readLarsReleaseManifest();
    let plan = planMediaUploads(objects);
    let larsReleased: string[] = [];
    if (manifest) {
      const approvedMd5 = (objectPath: string) => manifest.files[objectPath.split("/").pop() ?? ""]?.md5;
      const release = planLarsRelease(objects, manifest);
      const problems = [...release.problems, ...(await larsCollisions(supabaseUrl, release, approvedMd5))];
      if (problems.length > 0) {
        plan = holdAllLars(release.plan, "Lars release stopped.");
        log("ACADEMY_LARS_RELEASE_ABORTED", { moduleNumber, problems: problems.slice(0, 40) });
      } else {
        plan = release.plan;
        larsReleased = release.released;
      }
    }
    const outcomes = await uploadPlannedMedia(plan, credentials);
    log("academy_preview_media", {
      moduleNumber,
      objects: objects.length,
      held: plan.filter((item) => item.status === "held").length,
      noSource: plan.filter((item) => item.status === "no-source").map((item) => item.objectPath),
      tooLarge: plan.filter((item) => item.status === "too-large").map((item) => item.objectPath),
      uploaded: outcomes.filter((item) => item.result === "uploaded").length,
      alreadyThere: outcomes.filter((item) => item.result === "skipped-same").length,
      conflicts: outcomes.filter((item) => item.result === "conflict").map((item) => item.objectPath),
      failed: outcomes.filter((item) => item.result === "failed").map((item) => `${item.objectPath} ${item.status}`),
    });
    const unpainted = new Set(plan.filter((item) => item.status === "no-source").map((item) => item.objectPath));
    let larsVerified = larsReleased.length > 0;
    if (larsReleased.length > 0) {
      const larsOutcomes = outcomes.filter((item) => larsReleased.includes(item.objectPath));
      const checks = await Promise.all(larsReleased.map((objectPath) => getPublic(supabaseUrl, objectPath)));
      const bad = checks.filter(
        (check) =>
          check.status !== 200 ||
          check.md5 !== manifest?.files[check.objectPath.split("/").pop() ?? ""]?.md5 ||
          !/immutable/.test(check.cacheControl ?? ""),
      );
      larsVerified = bad.length === 0 && !larsOutcomes.some((item) => item.result === "conflict" || item.result === "failed");
      log("academy_preview_lars_release", {
        moduleNumber,
        released: larsReleased.length,
        uploaded: larsOutcomes.filter((item) => item.result === "uploaded").length,
        alreadyThere: larsOutcomes.filter((item) => item.result === "skipped-same").length,
        conflicts: larsOutcomes.filter((item) => item.result === "conflict").map((item) => item.objectPath),
        failed: larsOutcomes.filter((item) => item.result === "failed").map((item) => `${item.objectPath} ${item.status}`),
        verifyFailed: bad.map((check) => `${check.objectPath} ${check.status}`),
        verified: larsVerified,
      });
    }
    const heads = await headPublicObjects(supabaseUrl, objects);
    const checked = readMasterWorkbookFile(MASTER_WORKBOOK_PATH, {
      moduleNumber,
      knownMedia: knownMediaFrom(heads),
    });
    const previous = await currentPayload(credentials, moduleNumber);
    const result = await publishMasterDraft(checked, {
      previous: previous?.payload ?? null,
      store: restVersionStore(credentials, moduleNumber),
      // Pictures with no file anywhere yet show the placeholder on the
      // preview. Held Lars art is allowed only while it is still held: once
      // released and checked, a missing Lars picture blocks the draft.
      // Promote still refuses a version with any pending item.
      allowPending: (objectPath) =>
        unpainted.has(objectPath) || (!larsVerified && isHeldLarsMedia(objectPath)),
    });
    if (!result.ok) {
      log("ACADEMY_JOB_FAILED", { moduleNumber, blocked: result.blocked.slice(0, 40), issues: result.issues.slice(0, 20) });
      continue;
    }
    log("academy_preview_draft", {
      moduleNumber,
      versionId: result.versionId,
      wrote: result.wrote,
      pending: result.pending.length,
    });
  }
}

run().then(
  () => process.exit(0),
  (error: unknown) => {
    log("ACADEMY_JOB_FAILED", { reason: error instanceof Error ? error.message : "unknown" });
    process.exit(0);
  },
);
