/**
 * Upload the pictures and clips a module's lessons name to the academy-media
 * bucket. Dry run unless --apply. Delta only: an object already in the bucket
 * is skipped, and a name is never overwritten. Held Lars art is skipped unless
 * --release-held is passed (only after Jasper's OK, with the approved
 * compressed files passed first via --source).
 *
 *   npx tsx tools/upload-academy-media.ts --module 1
 *   npx tsx tools/upload-academy-media.ts --module 1 --apply
 *   npx tsx tools/upload-academy-media.ts --module 1 --verify
 *   npx tsx tools/upload-academy-media.ts --module 1 --release-held \
 *     --source /path/to/lars-compressed --source /path/to/lars-compressed/pairs --apply
 *
 * --apply needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
 * environment. --verify needs only NEXT_PUBLIC_SUPABASE_URL (public reads).
 */
import { MASTER_WORKBOOK_PATH, readMasterWorkbookFile } from "@/lib/academy/lessons/payload/master/read-master";
import { ACADEMY_MEDIA_CACHE_CONTROL } from "@/lib/academy/media/held-media";
import {
  DEFAULT_MEDIA_SOURCE_DIRS,
  headPublicObjects,
  planMediaUploads,
  uploadPlannedMedia,
} from "@/lib/academy/media/media-sync";

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
function argValues(name: string): string[] {
  const values: string[] = [];
  process.argv.forEach((value, index) => {
    const next = process.argv[index + 1];
    if (value === name && next) values.push(next);
  });
  return values;
}

async function main(): Promise<number> {
  const apply = process.argv.includes("--apply");
  const verify = process.argv.includes("--verify");
  const releaseHeld = process.argv.includes("--release-held");
  const moduleNumber = Number(argValue("--module") ?? "1");
  const workbook = argValue("--workbook") ?? MASTER_WORKBOOK_PATH;
  const sourceDirs = [...argValues("--source"), ...DEFAULT_MEDIA_SOURCE_DIRS];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";

  const master = readMasterWorkbookFile(workbook, {
    moduleNumber,
    mediaBase: supabaseUrl ? undefined : "https://example.invalid/academy-media",
  });
  if (master.issues.length > 0) {
    for (const issue of master.issues) console.error(`${issue.sheet} row ${issue.row}: ${issue.reason}`);
    console.error("Workbook has errors. Nothing uploaded.");
    return 1;
  }
  const objects = [...master.media.images, ...master.media.audio];
  const plan = planMediaUploads(objects, { sourceDirs, releaseHeld });
  const count = (status: string) => plan.filter((item) => item.status === status).length;
  console.log(
    `Module ${moduleNumber}: ${objects.length} objects. Upload ${count("upload")}, held ${count("held")}, ` +
      `no source ${count("no-source")}, over cap ${count("too-large")}. Cache-Control: ${ACADEMY_MEDIA_CACHE_CONTROL}`,
  );
  for (const item of plan) {
    if (item.status !== "upload") console.log(`  ${item.status}: ${item.objectPath}${item.note ? ` (${item.note})` : ""}`);
  }
  const blocking = plan.filter((item) => item.status === "no-source" || item.status === "too-large");

  if (verify) {
    if (!supabaseUrl) {
      console.error("Set NEXT_PUBLIC_SUPABASE_URL to verify.");
      return 1;
    }
    const heads = await headPublicObjects(supabaseUrl, objects);
    const bad = heads.filter((head) => head.status !== 200);
    console.log(JSON.stringify({ verified: heads.length, ok: heads.length - bad.length, heads }, null, 2));
    return bad.length > 0 ? 2 : 0;
  }

  if (!apply) {
    console.log("Dry run. Pass --apply with Supabase credentials to upload.");
    return blocking.length > 0 ? 1 : 0;
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!supabaseUrl || !serviceKey) {
    console.error("Refusing to upload. Supabase URL or service role key is missing.");
    return 1;
  }
  const outcomes = await uploadPlannedMedia(plan, { supabaseUrl, serviceKey });
  const tally = (result: string) => outcomes.filter((item) => item.result === result).length;
  for (const item of outcomes) {
    if (item.result === "conflict" || item.result === "failed") {
      console.error(`  ${item.result}: ${item.objectPath} ${item.status ?? ""} ${item.note ?? ""}`);
    }
  }
  console.log(
    `Uploaded ${tally("uploaded")}. Already there ${tally("skipped-same")}. Conflicts ${tally("conflict")}. Failed ${tally("failed")}.`,
  );
  return tally("conflict") + tally("failed") > 0 || blocking.length > 0 ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : "Upload failed.");
    process.exit(1);
  },
);
