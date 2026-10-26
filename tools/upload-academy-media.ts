/**
 * Upload lesson pictures and audio to the academy-media bucket.
 * Dry run unless --apply is passed. Does not recompress or resize.
 * An object name that already exists is skipped. Names are never overwritten.
 *
 *   npx tsx tools/upload-academy-media.ts
 *   npx tsx tools/upload-academy-media.ts --apply
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOTS = [
  { dir: path.join(process.cwd(), "public/assets/illustrations"), folder: "images" },
  { dir: path.join(process.cwd(), "public/academy-audio"), folder: "audio" },
];

type PlannedUpload = {
  folder: "images" | "audio";
  objectName: string;
  absolutePath: string;
  bytes: number;
};

const apply = process.argv.includes("--apply");
const planned = planUploads();
const names = new Map<string, string>();
let collisions = 0;
for (const item of planned) {
  const key = `${item.folder}/${item.objectName}`;
  const previous = names.get(key);
  if (previous && previous !== item.absolutePath) {
    collisions += 1;
    console.error(`Name collision ${key}: ${previous} and ${item.absolutePath}`);
  }
  names.set(key, item.absolutePath);
}
if (collisions > 0) {
  console.error("Stopped. Fix the duplicate names before uploading.");
  process.exit(1);
}

console.log(`Planned ${planned.length} objects. WebP and MP3 bytes are copied as-is.`);
if (!apply) {
  console.log("Dry run. Pass --apply with Supabase credentials to upload. Existing names are skipped.");
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
if (!url || !serviceKey) {
  console.error("Refusing to upload. Supabase URL or service role key is missing.");
  process.exit(1);
}

void applyUpload(url, serviceKey, planned).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Upload failed.");
  process.exit(1);
});

async function applyUpload(
  url: string,
  serviceKey: string,
  planned: PlannedUpload[],
): Promise<void> {
let uploaded = 0;
let skipped = 0;
for (const item of planned) {
  const objectPath = `${item.folder}/${encodeURIComponent(item.objectName)}`;
  const head = await fetch(`${url}/storage/v1/object/academy-media/${objectPath}`, {
    method: "HEAD",
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
  });
  if (head.ok) {
    skipped += 1;
    continue;
  }
  if (head.status !== 400 && head.status !== 404) {
    console.error(`Could not check ${objectPath} (${head.status}). Stopped without overwriting.`);
    process.exit(1);
  }
  const body = readFileSync(item.absolutePath);
  const type = item.objectName.endsWith(".mp3") ? "audio/mpeg" : "image/webp";
  const put = await fetch(`${url}/storage/v1/object/academy-media/${objectPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": type,
      "x-upsert": "false",
    },
    body,
  });
  if (put.status === 409 || put.status === 400) {
    skipped += 1;
    continue;
  }
  if (!put.ok) {
    console.error(`Upload failed for ${objectPath} (${put.status}).`);
    process.exit(1);
  }
  uploaded += 1;
}
console.log(`Uploaded ${uploaded}. Skipped ${skipped} existing names.`);
}

function planUploads(): PlannedUpload[] {
  const planned: PlannedUpload[] = [];
  for (const root of ROOTS) {
    for (const absolute of walk(root.dir)) {
      const base = path.basename(absolute);
      if (!/\.(webp|mp3)$/i.test(base)) continue;
      planned.push({
        folder: root.folder as "images" | "audio",
        objectName: base,
        absolutePath: absolute,
        bytes: statSync(absolute).size,
      });
    }
  }
  return planned;
}

function walk(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(absolute));
    else if (entry.isFile()) found.push(absolute);
  }
  return found;
}
