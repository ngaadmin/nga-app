import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { readMasterWorkbookFile, MASTER_WORKBOOK_PATH } from "@/lib/academy/lessons/payload/master/read-master";
import { md5Of } from "@/lib/academy/media/lars-release";
import { applyManifestReleases, readMediaReleases } from "@/lib/academy/media/manifest-release";
import { planMediaUploads } from "@/lib/academy/media/media-sync";

function sandbox(files: Record<string, string>) {
  const cwd = mkdtempSync(path.join(tmpdir(), "media-release-"));
  for (const [rel, body] of Object.entries(files)) {
    const file = path.join(cwd, rel);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, body);
  }
  return cwd;
}

const release = (files: Record<string, { md5: string; bytes: number }>) => [
  { manifest: "m.json", dir: "rel", files },
];

describe("manifest media release", () => {
  it("releases a named picture from its committed file", () => {
    const cwd = sandbox({ "rel/pippa-standing-512.webp": "pippa" });
    const plan = planMediaUploads(["images/pippa-standing-512.webp"], { cwd });
    expect(plan[0]?.status).toBe("no-source");
    const result = applyManifestReleases(plan, release({ "pippa-standing-512.webp": { md5: md5Of(Buffer.from("pippa")), bytes: 5 } }), { cwd });
    expect(result.problems).toEqual([]);
    expect(result.released).toEqual([{ objectPath: "images/pippa-standing-512.webp", md5: md5Of(Buffer.from("pippa")) }]);
    expect(result.plan[0]).toMatchObject({ status: "upload", bytes: 5 });
  });

  it("holds the whole manifest on an md5 mismatch", () => {
    const cwd = sandbox({ "rel/a.webp": "changed", "rel/b.webp": "b" });
    const plan = planMediaUploads(["images/a.webp", "images/b.webp"], { cwd });
    const result = applyManifestReleases(
      plan,
      release({ "a.webp": { md5: md5Of(Buffer.from("a")), bytes: 1 }, "b.webp": { md5: md5Of(Buffer.from("b")), bytes: 1 } }),
      { cwd },
    );
    expect(result.problems).toHaveLength(1);
    expect(result.released).toEqual([]);
    expect(result.plan.every((item) => item.status === "held")).toBe(true);
  });

  it("leaves Lars names and names the master doesn't use alone", () => {
    const cwd = sandbox({ "rel/lars-x.webp": "l", "rel/unused.webp": "u" });
    const plan = planMediaUploads(["images/lars-x.webp"], { cwd });
    const result = applyManifestReleases(
      plan,
      release({ "lars-x.webp": { md5: md5Of(Buffer.from("l")), bytes: 1 }, "unused.webp": { md5: md5Of(Buffer.from("u")), bytes: 1 } }),
      { cwd },
    );
    expect(result.released).toEqual([]);
    expect(result.plan[0]?.status).toBe("held");
  });

  it("the committed manifests match their files and the master names every released picture", () => {
    const releases = readMediaReleases();
    expect(releases.length).toBeGreaterThan(0);
    const master = readMasterWorkbookFile(MASTER_WORKBOOK_PATH, {
      moduleNumber: 1,
      mediaBase: "https://test-project.supabase.co/storage/v1/object/public/academy-media",
    });
    const result = applyManifestReleases(planMediaUploads(master.media.images), releases);
    expect(result.problems).toEqual([]);
    const names = releases.flatMap((loaded) => Object.keys(loaded.files)).sort();
    expect(result.released.map((entry) => entry.objectPath.split("/").pop()).sort()).toEqual(names);
  });
});
