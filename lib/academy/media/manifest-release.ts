/**
 * Release of approved, non-Lars pictures from a committed md5 manifest, the
 * same way the Lars set was released (see lars-release.ts).
 *
 * A name is released only when the master names it, it is in a manifest, and
 * its committed file has exactly the manifest md5 and bytes. Any problem in a
 * manifest holds every name in it, so nothing from that manifest is uploaded.
 * Bucket names are never overwritten: the job checks each name for other
 * bytes before uploading and the upload itself uses x-upsert: false.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { imageByteCap, isHeldLarsMedia } from "@/lib/academy/media/held-media";
import { md5Of } from "@/lib/academy/media/lars-release";
import type { MediaPlanItem } from "@/lib/academy/media/media-sync";

export type MediaReleaseManifest = {
  approvedBy: string;
  approvedOn: string;
  files: Record<string, { md5: string; bytes: number }>;
};

/** Committed release manifests and the folder holding each one's files. */
export const MEDIA_RELEASES: readonly { manifest: string; dir: string }[] = [
  { manifest: "tools/academy-media-release/pippa-1nov.json", dir: "tools/academy-media-release/pippa-1nov" },
];

export type LoadedMediaRelease = { manifest: string; dir: string; files: MediaReleaseManifest["files"] };

export function readMediaReleases(
  cwd = process.cwd(),
  releases: readonly { manifest: string; dir: string }[] = MEDIA_RELEASES,
): LoadedMediaRelease[] {
  const loaded: LoadedMediaRelease[] = [];
  for (const release of releases) {
    const file = path.resolve(cwd, release.manifest);
    if (!existsSync(file)) continue;
    const parsed = JSON.parse(readFileSync(file, "utf8")) as MediaReleaseManifest;
    loaded.push({ manifest: release.manifest, dir: release.dir, files: parsed.files ?? {} });
  }
  return loaded;
}

/** Folders the release files live in, for the plan's source lookup. */
export function mediaReleaseDirs(releases: readonly { dir: string }[] = MEDIA_RELEASES): string[] {
  return releases.map((release) => release.dir);
}

const baseName = (objectPath: string) => objectPath.split("/").pop() ?? "";

export type ManifestReleasePlan = {
  plan: MediaPlanItem[];
  /** Released object paths with the approved md5 each must have in the bucket. */
  released: { objectPath: string; md5: string }[];
  problems: string[];
};

/**
 * Point every manifest name the master uses at its committed file. Lars names
 * are left to the Lars release. A stopped manifest holds all of its names.
 */
export function applyManifestReleases(
  plan: readonly MediaPlanItem[],
  releases: readonly LoadedMediaRelease[],
  options: { cwd?: string } = {},
): ManifestReleasePlan {
  const cwd = options.cwd ?? process.cwd();
  let next = [...plan];
  const released: { objectPath: string; md5: string }[] = [];
  const problems: string[] = [];
  for (const release of releases) {
    const mine: { objectPath: string; md5: string }[] = [];
    const own: string[] = [];
    next = next.map((item) => {
      if (isHeldLarsMedia(item.objectPath)) return item;
      const name = baseName(item.objectPath);
      const approved = release.files[name];
      if (!approved) return item;
      const file = path.resolve(cwd, release.dir, name);
      if (!existsSync(file)) {
        own.push(`${item.objectPath}: no file in ${release.dir}`);
        return item;
      }
      const bytes = statSync(file).size;
      if (md5Of(readFileSync(file)) !== approved.md5 || bytes !== approved.bytes) {
        own.push(`${item.objectPath}: file does not match the approved md5 and bytes`);
        return item;
      }
      if (item.objectPath.startsWith("images/") && bytes > imageByteCap(item.objectPath)) {
        own.push(`${item.objectPath}: over the size cap`);
        return item;
      }
      mine.push({ objectPath: item.objectPath, md5: approved.md5 });
      return { objectPath: item.objectPath, absolutePath: file, bytes, status: "upload" };
    });
    if (own.length > 0) {
      problems.push(...own.map((problem) => `${release.manifest}: ${problem}`));
      next = holdReleased(next, release.files, `Release stopped (${release.manifest}).`);
    } else {
      released.push(...mine);
    }
  }
  return { plan: next, released, problems };
}

/** Hold every name in a manifest again, so none of it is uploaded. */
export function holdReleased(
  plan: readonly MediaPlanItem[],
  files: MediaReleaseManifest["files"],
  note: string,
): MediaPlanItem[] {
  return plan.map((item) =>
    !isHeldLarsMedia(item.objectPath) && files[baseName(item.objectPath)]
      ? { objectPath: item.objectPath, status: "held", note }
      : item,
  );
}
