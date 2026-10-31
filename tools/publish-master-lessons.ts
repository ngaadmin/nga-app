/**
 * Validate a module from the master workbook and, with --draft, store it as a
 * draft in academy_lesson_versions. Drafts are visible only on preview
 * deployments. Nothing here writes academy_lesson_current.
 *
 *   npx tsx tools/publish-master-lessons.ts --module 1
 *   npx tsx tools/publish-master-lessons.ts --module 1 --check-bucket
 *   npx tsx tools/publish-master-lessons.ts --module 1 --draft
 *   npx tsx tools/publish-master-lessons.ts --promote <version-id>
 *
 * --check-bucket asks the public bucket for every picture and clip. A missing
 * object blocks the draft. --allow-held-pending lets only held Lars art be
 * missing; it's listed in media.pending and the version can't be promoted.
 *
 * --promote only checks the version and prints the statement to run. It never
 * runs it. After the pointer moves, POST /api/academy/revalidate.
 */
import {
  promotionBlockers,
  publishMasterDraft,
} from "@/lib/academy/lessons/payload/master/publish-master";
import { MASTER_WORKBOOK_PATH, readMasterWorkbookFile } from "@/lib/academy/lessons/payload/master/read-master";
import {
  currentPayload,
  restVersionStore,
  versionPayload,
} from "@/lib/academy/lessons/payload/master/version-store";
import { isHeldLarsMedia } from "@/lib/academy/media/held-media";
import { headPublicObjects, knownMediaFrom } from "@/lib/academy/media/media-sync";

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<number> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const promoteId = argValue("--promote");
  if (promoteId) return reportPromotion(promoteId, supabaseUrl, serviceKey);

  const moduleNumber = Number(argValue("--module") ?? "1");
  const workbook = argValue("--workbook") ?? MASTER_WORKBOOK_PATH;
  const draft = process.argv.includes("--draft");
  const checkBucket = draft || process.argv.includes("--check-bucket");
  const allowHeld = process.argv.includes("--allow-held-pending");

  const firstRead = readMasterWorkbookFile(workbook, { moduleNumber });
  let master = firstRead;
  if (checkBucket && firstRead.issues.length === 0) {
    if (!supabaseUrl) {
      console.error("Set NEXT_PUBLIC_SUPABASE_URL to check the bucket.");
      return 1;
    }
    const heads = await headPublicObjects(supabaseUrl, [...firstRead.media.images, ...firstRead.media.audio]);
    master = readMasterWorkbookFile(workbook, { moduleNumber, knownMedia: knownMediaFrom(heads) });
  }
  if (master.issues.length > 0 || !master.contentHash) {
    for (const issue of master.issues) console.error(`${issue.sheet} row ${issue.row}: ${issue.reason}`);
    console.error("Publish rejected. Nothing was stored.");
    return 1;
  }
  console.log(
    `Module ${moduleNumber} valid. Hash ${master.contentHash}. ` +
      `${master.media.images.length} pictures, ${master.media.audio.length} clips.`,
  );

  const credentials = { supabaseUrl, serviceKey };
  if (draft && (!supabaseUrl || !serviceKey)) {
    console.error("Refusing to store a draft. Supabase URL or service role key is missing.");
    return 1;
  }
  const previous = draft ? await currentPayload(credentials, moduleNumber) : null;
  const result = await publishMasterDraft(master, {
    previous: previous?.payload ?? null,
    store: draft ? restVersionStore(credentials, moduleNumber) : undefined,
    allowPending: allowHeld ? isHeldLarsMedia : undefined,
  });
  for (const line of result.blocked) console.error(`  blocked: ${line}`);
  if (result.pending.length > 0) {
    console.log(`  pending (held, blocks promote): ${result.pending.length}`);
    for (const object of result.pending) console.log(`    ${object}`);
  }
  if (!result.ok) {
    console.error("Publish rejected. Nothing was stored.");
    return 1;
  }
  if (!draft) {
    console.log("Check only. Pass --draft to store a draft version.");
    return 0;
  }
  console.log(
    result.wrote
      ? `Stored draft version ${result.versionId}.`
      : `A version with this hash already exists: ${result.versionId}.`,
  );
  console.log("Current was not changed. Review it on the preview, then promote.");
  return 0;
}

async function reportPromotion(versionId: string, supabaseUrl: string, serviceKey: string): Promise<number> {
  if (!/^[0-9a-f-]{36}$/i.test(versionId)) {
    console.error("Pass a version id.");
    return 1;
  }
  if (!supabaseUrl || !serviceKey) {
    console.error("Supabase URL or service role key is missing.");
    return 1;
  }
  const version = await versionPayload({ supabaseUrl, serviceKey }, versionId);
  if (!version) {
    console.error("No such version.");
    return 1;
  }
  const blockers = promotionBlockers(version.payload, version.moduleNumber);
  if (blockers.length > 0) {
    console.error(`Version ${versionId} can't be promoted:`);
    for (const line of blockers) console.error(`  ${line}`);
    return 1;
  }
  console.log("Ready. This tool does not move the pointer. To go live, run:");
  console.log(
    `  insert into public.academy_lesson_current (module_number, version_id, updated_at)\n` +
      `  values (${version.moduleNumber}, '${versionId}', now())\n` +
      `  on conflict (module_number) do update set version_id = excluded.version_id, updated_at = now();`,
  );
  console.log("Then POST /api/academy/revalidate with the x-academy-revalidate-secret header.");
  return 0;
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : "Publish failed.");
    process.exit(1);
  },
);
