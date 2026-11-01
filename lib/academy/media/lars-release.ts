/**
 * Release of the held Lars art after Jasper's OK on the compressed set.
 *
 * The approved set is a committed manifest of file name and md5. A held name is
 * released only when it is in the manifest, its source file has that exact
 * md5, and the bucket doesn't already hold different bytes under that name.
 * Any mismatch or name collision stops the whole release, so nothing Lars is
 * uploaded and the held pictures stay pending.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { isHeldLarsMedia } from "@/lib/academy/media/held-media";
import { DEFAULT_MEDIA_SOURCE_DIRS, type MediaPlanItem, planMediaUploads } from "@/lib/academy/media/media-sync";

export const LARS_RELEASE_MANIFEST = "tools/academy-media-release/lars-31oct.json";
export const LARS_RELEASE_DIR = "tools/academy-media-release/lars-31oct";

export type LarsReleaseManifest = {
  approvedBy: string;
  approvedOn: string;
  files: Record<string, { md5: string; bytes: number }>;
};

export function md5Of(bytes: Buffer | Uint8Array): string {
  return createHash("md5").update(bytes).digest("hex");
}

export function readLarsReleaseManifest(cwd = process.cwd()): LarsReleaseManifest | null {
  const file = path.resolve(cwd, LARS_RELEASE_MANIFEST);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as LarsReleaseManifest;
}

const baseName = (objectPath: string) => objectPath.split("/").pop() ?? "";

export type LarsReleasePlan = {
  plan: MediaPlanItem[];
  /** Held names in this module that the manifest releases. */
  released: string[];
  /** Why the release stopped. Empty when it can go ahead. */
  problems: string[];
};

/**
 * Plan uploads with the approved Lars files first in the source order. Held
 * names outside the manifest stay held. Any problem holds every Lars name.
 */
export function planLarsRelease(
  objectPaths: readonly string[],
  manifest: LarsReleaseManifest,
  options: { cwd?: string } = {},
): LarsReleasePlan {
  const cwd = options.cwd ?? process.cwd();
  const raw = planMediaUploads(objectPaths, {
    cwd,
    releaseHeld: true,
    sourceDirs: [LARS_RELEASE_DIR, ...DEFAULT_MEDIA_SOURCE_DIRS],
  });
  const problems: string[] = [];
  const released: string[] = [];
  const plan = raw.map((item): MediaPlanItem => {
    if (!isHeldLarsMedia(item.objectPath)) return item;
    const approved = manifest.files[baseName(item.objectPath)];
    if (!approved) return { objectPath: item.objectPath, status: "held", note: "Not in the approved Lars set." };
    if (item.status !== "upload" || !item.absolutePath) {
      problems.push(`${item.objectPath}: ${item.status}`);
      return item;
    }
    const actual = md5Of(readFileSync(item.absolutePath));
    if (actual !== approved.md5) problems.push(`${item.objectPath}: source md5 does not match the approved file`);
    released.push(item.objectPath);
    return item;
  });
  return { plan, released, problems };
}

/** Hold every Lars name again, after a stopped release. */
export function holdAllLars(plan: readonly MediaPlanItem[], note: string): MediaPlanItem[] {
  return plan.map((item) =>
    isHeldLarsMedia(item.objectPath) ? { objectPath: item.objectPath, status: "held", note } : item,
  );
}
