import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { readMasterWorkbookFile, MASTER_WORKBOOK_PATH } from "@/lib/academy/lessons/payload/master/read-master";
import { isHeldLarsMedia } from "@/lib/academy/media/held-media";
import {
  holdAllLars,
  LARS_RELEASE_DIR,
  md5Of,
  planLarsRelease,
  readLarsReleaseManifest,
} from "@/lib/academy/media/lars-release";

function sandbox(files: Record<string, string>) {
  const cwd = mkdtempSync(path.join(tmpdir(), "lars-release-"));
  for (const [rel, body] of Object.entries(files)) {
    const file = path.join(cwd, rel);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, body);
  }
  return cwd;
}

describe("Lars release", () => {
  it("uses the approved file ahead of a /public file with the same name", () => {
    const cwd = sandbox({
      [`${LARS_RELEASE_DIR}/beat-ex-m1-l8-r2.webp`]: "approved",
      "public/assets/illustrations/scenes/beat-ex-m1-l8-r2.webp": "original",
      "public/assets/illustrations/characters/lars-waving-512.webp": "waving",
    });
    const manifest = {
      approvedBy: "t",
      approvedOn: "t",
      files: {
        "beat-ex-m1-l8-r2.webp": { md5: md5Of(Buffer.from("approved")), bytes: 8 },
        "lars-waving-512.webp": { md5: md5Of(Buffer.from("waving")), bytes: 6 },
      },
    };
    const result = planLarsRelease(["images/beat-ex-m1-l8-r2.webp", "images/lars-waving-512.webp"], manifest, { cwd });
    expect(result.problems).toEqual([]);
    expect(result.released).toHaveLength(2);
    const beat = result.plan.find((item) => item.objectPath.includes("l8-r2"));
    expect(beat?.absolutePath).toContain(LARS_RELEASE_DIR);
  });

  it("stops on an md5 that isn't the approved one", () => {
    const cwd = sandbox({ "public/assets/illustrations/lars-waving-512.webp": "changed" });
    const manifest = { approvedBy: "t", approvedOn: "t", files: { "lars-waving-512.webp": { md5: md5Of(Buffer.from("waving")), bytes: 6 } } };
    const result = planLarsRelease(["images/lars-waving-512.webp"], manifest, { cwd });
    expect(result.problems).toHaveLength(1);
    expect(holdAllLars(result.plan, "x").every((item) => item.status === "held")).toBe(true);
  });

  it("keeps a held name outside the manifest held", () => {
    const cwd = sandbox({ "public/assets/illustrations/lars-new.webp": "n" });
    const result = planLarsRelease(["images/lars-new.webp"], { approvedBy: "t", approvedOn: "t", files: {} }, { cwd });
    expect(result.plan[0]?.status).toBe("held");
    expect(result.released).toEqual([]);
  });

  it("the committed manifest covers every held module 1 picture and matches the repo files", () => {
    const manifest = readLarsReleaseManifest();
    expect(manifest).not.toBeNull();
    const master = readMasterWorkbookFile(MASTER_WORKBOOK_PATH, {
      moduleNumber: 1,
      mediaBase: "https://test-project.supabase.co/storage/v1/object/public/academy-media",
    });
    expect(master.media.images.length).toBeGreaterThan(50);
    const held = master.media.images.filter((objectPath) => isHeldLarsMedia(objectPath));
    const result = planLarsRelease(held, manifest!);
    expect(result.problems).toEqual([]);
    expect(result.released.sort()).toEqual([...held].sort());
    expect(Object.keys(manifest!.files).sort()).toEqual(held.map((objectPath) => objectPath.split("/").pop()).sort());
    for (const item of result.plan) expect(item.bytes).toBeLessThanOrEqual(90 * 1024);
  });
});
