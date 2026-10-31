/**
 * Preview-only build step. Uploads the lesson media a module names (held Lars
 * art excluded) and stores the workbook as a draft version, so a preview can
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
  headPublicObjects,
  knownMediaFrom,
  planMediaUploads,
  uploadPlannedMedia,
} from "@/lib/academy/media/media-sync";

const ACADEMY_PREVIEW_JOB_BRANCHES = ["cursor/stage2-unwind-lesson-files-999a"];

function log(event: string, detail: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ event, ...detail }));
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
    const plan = planMediaUploads(objects);
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
    const heads = await headPublicObjects(supabaseUrl, objects);
    const checked = readMasterWorkbookFile(MASTER_WORKBOOK_PATH, {
      moduleNumber,
      knownMedia: knownMediaFrom(heads),
    });
    const previous = await currentPayload(credentials, moduleNumber);
    const result = await publishMasterDraft(checked, {
      previous: previous?.payload ?? null,
      store: restVersionStore(credentials, moduleNumber),
      allowPending: isHeldLarsMedia,
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
