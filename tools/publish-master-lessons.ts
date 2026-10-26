/**
 * Validate the master workbook and, with --apply, store a new version.
 * A bad row prints sheet, row, and reason and does not write.
 * Without --apply this only prints the result. It does not call Supabase.
 *
 *   npx tsx tools/publish-master-lessons.ts
 *   npx tsx tools/publish-master-lessons.ts --apply
 */
import { publishMasterModule } from "@/lib/academy/lessons/payload/master/publish-master";
import { loadBundledMasterModule } from "@/lib/academy/lessons/payload/master/read-master";

const apply = process.argv.includes("--apply");
const master = loadBundledMasterModule();

if (master.issues.length > 0 || !master.contentHash) {
  for (const issue of master.issues) {
    console.error(`${issue.sheet} row ${issue.row}: ${issue.reason}`);
  }
  console.error("Publish rejected. The current version was not changed.");
  process.exit(1);
}

const missingAudio = master.missing.filter((item) => item.kind === "audio");
const missingImages = master.missing.filter((item) => item.kind === "image");
console.log(`Valid. Hash ${master.contentHash}.`);
console.log(`Unresolved audio ${missingAudio.length}. Unresolved pictures ${missingImages.length}.`);
for (const item of master.missing) {
  console.log(`${item.sheet} row ${item.row}: missing ${item.kind} ${item.name}`);
}

if (!apply) {
  console.log("Dry run. Pass --apply with Supabase credentials to store this version.");
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
if (!url || !serviceKey) {
  console.error("Refusing to write. Supabase URL or service role key is missing.");
  process.exit(1);
}

void applyPublish(url, serviceKey).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Publish failed.");
  process.exit(1);
});

async function applyPublish(url: string, serviceKey: string): Promise<void> {
const wrote = await publishMasterModule(master, {
  async currentHash() {
    const response = await fetch(
      `${url}/rest/v1/academy_lesson_current?module_number=eq.1&select=academy_lesson_versions(content_hash)`,
      { headers: serviceHeaders(serviceKey) },
    );
    if (!response.ok) throw new Error(`Current pointer read failed (${response.status}).`);
    const rows = (await response.json()) as Array<{
      academy_lesson_versions?: { content_hash?: string } | { content_hash?: string }[];
    }>;
    const joined = rows[0]?.academy_lesson_versions;
    const record = Array.isArray(joined) ? joined[0] : joined;
    return record?.content_hash ?? null;
  },
  async save(hash, payload) {
    const inserted = await fetch(`${url}/rest/v1/academy_lesson_versions`, {
      method: "POST",
      headers: {
        ...serviceHeaders(serviceKey),
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ module_number: 1, content_hash: hash, payload }),
    });
    if (!inserted.ok) throw new Error(`Version insert failed (${inserted.status}).`);
    const rows = (await inserted.json()) as Array<{ id?: string }>;
    const id = rows[0]?.id;
    if (!id) throw new Error("Version insert did not return an id.");
    const pointer = await fetch(`${url}/rest/v1/academy_lesson_current?on_conflict=module_number`, {
      method: "POST",
      headers: {
        ...serviceHeaders(serviceKey),
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({ module_number: 1, version_id: id, updated_at: new Date().toISOString() }),
    });
    if (!pointer.ok) throw new Error(`Current pointer update failed (${pointer.status}).`);
  },
});

if (!wrote.ok) {
  console.error("Publish rejected. The current version was not changed.");
  process.exit(1);
}
console.log(wrote.wrote ? "Stored a new current version." : "Current version already matches this hash.");
}

function serviceHeaders(key: string): Record<string, string> {
  return { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" };
}
