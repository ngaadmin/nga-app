/**
 * Upload and check lesson media in the academy-media bucket.
 * Used by tools/upload-academy-media.ts and the preview job. Never by a request.
 *
 * Rules:
 * - Delta only. An object that already exists with the same size is skipped.
 * - Never overwrite. An existing object with a different size stops that name.
 * - Held Lars art is skipped unless released after Jasper's OK.
 * - Pictures over the size cap are refused.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { ACADEMY_MEDIA_BUCKET } from "@/lib/academy/media/academy-media";
import {
  ACADEMY_MEDIA_CACHE_CONTROL,
  imageByteCap,
  isHeldLarsMedia,
  supabaseKeyHeaders,
} from "@/lib/academy/media/held-media";

export const DEFAULT_MEDIA_SOURCE_DIRS = [
  "public/assets/illustrations",
  "public/academy-audio",
];

export type MediaPlanItem = {
  objectPath: string;
  absolutePath?: string;
  bytes?: number;
  status: "upload" | "held" | "no-source" | "too-large";
  note?: string;
};

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp3": "audio/mpeg",
};

export function contentTypeFor(name: string): string | undefined {
  return CONTENT_TYPES[path.extname(name).toLowerCase()];
}

function indexDir(dir: string, index: Map<string, string>): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) indexDir(absolute, index);
    else if (entry.isFile() && !index.has(entry.name)) index.set(entry.name, absolute);
  }
}

/**
 * Find a source file for every object. Earlier dirs win, so an approved
 * compressed set passed first is used in place of the /public original.
 */
export function planMediaUploads(
  objectPaths: readonly string[],
  options: { sourceDirs?: readonly string[]; releaseHeld?: boolean; cwd?: string } = {},
): MediaPlanItem[] {
  const cwd = options.cwd ?? process.cwd();
  const dirs = (options.sourceDirs ?? DEFAULT_MEDIA_SOURCE_DIRS).map((dir) => path.resolve(cwd, dir));
  const index = new Map<string, string>();
  for (const dir of dirs) indexDir(dir, index);
  const plan: MediaPlanItem[] = [];
  for (const objectPath of [...new Set(objectPaths)].sort()) {
    const name = objectPath.split("/").pop() ?? "";
    if (isHeldLarsMedia(objectPath) && !options.releaseHeld) {
      plan.push({ objectPath, status: "held", note: "Waiting for Jasper's OK on the compressed Lars set." });
      continue;
    }
    const absolutePath = index.get(name);
    if (!absolutePath || !contentTypeFor(name)) {
      plan.push({ objectPath, status: "no-source" });
      continue;
    }
    const bytes = statSync(absolutePath).size;
    if (objectPath.startsWith("images/") && bytes > imageByteCap(objectPath)) {
      plan.push({
        objectPath,
        absolutePath,
        bytes,
        status: "too-large",
        note: `${Math.round(bytes / 1024)}KB is over the ${Math.round(imageByteCap(objectPath) / 1024)}KB cap.`,
      });
      continue;
    }
    plan.push({ objectPath, absolutePath, bytes, status: "upload" });
  }
  return plan;
}

export function publicObjectUrl(supabaseUrl: string, objectPath: string): string {
  const [folder, ...rest] = objectPath.split("/");
  const name = rest.join("/");
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${ACADEMY_MEDIA_BUCKET}/${folder}/${encodeURIComponent(name)}`;
}

export type PublicHead = {
  objectPath: string;
  status: number;
  bytes?: number;
  contentType?: string;
  cacheControl?: string;
};

export async function headPublicObject(supabaseUrl: string, objectPath: string): Promise<PublicHead> {
  const response = await fetch(publicObjectUrl(supabaseUrl, objectPath), { method: "HEAD", cache: "no-store" });
  const length = response.headers.get("content-length");
  return {
    objectPath,
    status: response.status,
    bytes: length ? Number(length) : undefined,
    contentType: response.headers.get("content-type") ?? undefined,
    cacheControl: response.headers.get("cache-control") ?? undefined,
  };
}

export async function headPublicObjects(
  supabaseUrl: string,
  objectPaths: readonly string[],
  concurrency = 8,
): Promise<PublicHead[]> {
  const results: PublicHead[] = [];
  const queue = [...objectPaths];
  async function worker() {
    for (;;) {
      const next = queue.shift();
      if (!next) return;
      try {
        results.push(await headPublicObject(supabaseUrl, next));
      } catch {
        results.push({ objectPath: next, status: 0 });
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results.sort((a, b) => a.objectPath.localeCompare(b.objectPath));
}

export type UploadOutcome = {
  objectPath: string;
  result: "uploaded" | "skipped-same" | "conflict" | "failed";
  status?: number;
  note?: string;
};

/** Upload planned items. Credentials come from the caller's environment and are never logged. */
export async function uploadPlannedMedia(
  plan: readonly MediaPlanItem[],
  credentials: { supabaseUrl: string; serviceKey: string },
): Promise<UploadOutcome[]> {
  const outcomes: UploadOutcome[] = [];
  const base = credentials.supabaseUrl.replace(/\/+$/, "");
  for (const item of plan) {
    if (item.status !== "upload" || !item.absolutePath) continue;
    const existing = await headPublicObject(base, item.objectPath);
    if (existing.status === 200) {
      outcomes.push(
        existing.bytes === item.bytes
          ? { objectPath: item.objectPath, result: "skipped-same" }
          : {
              objectPath: item.objectPath,
              result: "conflict",
              note: `Bucket has ${existing.bytes} bytes, source has ${item.bytes}. Not overwritten. Use a new name.`,
            },
      );
      continue;
    }
    const [folder, ...rest] = item.objectPath.split("/");
    const name = rest.join("/");
    const response = await fetch(
      `${base}/storage/v1/object/${ACADEMY_MEDIA_BUCKET}/${folder}/${encodeURIComponent(name)}`,
      {
        method: "POST",
        headers: {
          ...supabaseKeyHeaders(credentials.serviceKey),
          "Content-Type": contentTypeFor(name) ?? "application/octet-stream",
          "cache-control": ACADEMY_MEDIA_CACHE_CONTROL,
          "x-upsert": "false",
        },
        body: readFileSync(item.absolutePath),
      },
    );
    if (response.ok) {
      outcomes.push({ objectPath: item.objectPath, result: "uploaded", status: response.status });
    } else if (response.status === 409) {
      outcomes.push({ objectPath: item.objectPath, result: "conflict", status: 409, note: "Name already exists." });
    } else {
      outcomes.push({ objectPath: item.objectPath, result: "failed", status: response.status });
    }
  }
  return outcomes;
}

/** Objects that answer 200 on the public URL. */
export function knownMediaFrom(heads: readonly PublicHead[]): Set<string> {
  return new Set(heads.filter((head) => head.status === 200).map((head) => head.objectPath));
}
