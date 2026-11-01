import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadMasterLessonTrio,
  previewDraftSelector,
  resetAcademyLessonCacheForTests,
  trioFromRow,
} from "@/lib/academy/lessons/payload/master/fetch-published";
import {
  promotionBlockers,
  publishMasterDraft,
  type MasterPublishPayload,
} from "@/lib/academy/lessons/payload/master/publish-master";
import { MASTER_WORKBOOK_PATH, readMasterWorkbookFile } from "@/lib/academy/lessons/payload/master/read-master";
import { academyLessonImageSrc } from "@/lib/academy/media/academy-media";
import { imageByteCap, isHeldLarsMedia } from "@/lib/academy/media/held-media";
import { planMediaUploads } from "@/lib/academy/media/media-sync";
import type { LessonPayload } from "@/lib/academy/lessons/payload/types";

const BASE = "https://test-project.supabase.co/storage/v1/object/public/academy-media";
const DRAFT_ID = "11111111-2222-4333-8444-555555555555";

vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test-project.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon");

function lesson(lessonNumber: number, title = `Lesson ${lessonNumber}`): LessonPayload {
  return {
    moduleNumber: 1,
    lessonNumber,
    lessonTitle: title,
    screens: [{ screenLabel: "s1", gameType: "story" }],
  } as unknown as LessonPayload;
}

function row(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: DRAFT_ID,
    content_hash: "abc",
    schema: 1,
    module: 1,
    media_base: `${BASE}/`,
    explorer: lesson(3),
    pathfinder: lesson(3),
    maverick: lesson(3),
    ...overrides,
  };
}

/**
 * Stand-in for Supabase PostgREST 14.5 as seen in prod on 1 Nov 2026.
 * The pointer read returns `[{ version_id }]`; a version read by id returns the
 * selected columns. The old embedded read
 * (`academy_lesson_current?select=version:academy_lesson_versions(...)`) gets
 * the real prod shape: the last JSON index before `)` was sent as a text key,
 * so `maverick` came back null while explorer and pathfinder were objects.
 */
function postgrest14(versionRow: Record<string, unknown> = row()) {
  return vi.fn(async (input: string | URL) => {
    const url = decodeURIComponent(String(input));
    if (url.includes("academy_lesson_current") && url.includes("academy_lesson_versions(")) {
      return new Response(JSON.stringify([{ version: { ...versionRow, maverick: null } }]), { status: 200 });
    }
    if (url.includes("academy_lesson_current")) {
      return new Response(JSON.stringify([{ version_id: versionRow.id }]), { status: 200 });
    }
    if (url.includes("academy_lesson_versions") && url.includes(`id=eq.${String(versionRow.id)}`)) {
      return new Response(JSON.stringify([versionRow]), { status: 200 });
    }
    return new Response("[]", { status: 200 });
  });
}

describe("draft gating", () => {
  it("never reads a draft outside a Vercel preview", () => {
    expect(previewDraftSelector("latest", { VERCEL_ENV: "production" })).toEqual({ kind: "current" });
    expect(previewDraftSelector(DRAFT_ID, {})).toEqual({ kind: "current" });
    expect(previewDraftSelector(undefined, { ACADEMY_PREVIEW_VERSION_ID: "latest" })).toEqual({ kind: "current" });
  });

  it("reads a named or latest draft on a preview", () => {
    expect(previewDraftSelector(DRAFT_ID, { VERCEL_ENV: "preview" })).toEqual({ kind: "draft", id: DRAFT_ID });
    expect(previewDraftSelector(undefined, { VERCEL_ENV: "preview", ACADEMY_PREVIEW_VERSION_ID: "latest" })).toEqual({
      kind: "draft",
      id: "latest",
    });
    expect(previewDraftSelector("x;drop", { VERCEL_ENV: "preview" })).toEqual({ kind: "current" });
  });
});

describe("version rows", () => {
  it("accepts a good row and trims the media base", () => {
    const result = trioFromRow(row(), 1, 3, "current");
    expect(result).toMatchObject({ ok: true, mediaBase: BASE, versionId: DRAFT_ID });
  });

  it("rejects an unknown schemaVersion, another module, a wrong lesson, or no media base", () => {
    expect(trioFromRow(row({ schema: 2 }), 1, 3, "current").ok).toBe(false);
    expect(trioFromRow(row({ module: 2 }), 1, 3, "current").ok).toBe(false);
    expect(trioFromRow(row({ maverick: lesson(4) }), 1, 3, "current").ok).toBe(false);
    expect(trioFromRow(row({ media_base: "http://x" }), 1, 3, "current").ok).toBe(false);
    expect(trioFromRow(row({ media_base: null }), 1, 3, "current").ok).toBe(false);
  });
});

describe("loadMasterLessonTrio fallbacks", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  beforeEach(() => {
    resetAcademyLessonCacheForTests();
    warn.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  function events(): string[] {
    return warn.mock.calls.map((call) => JSON.parse(String(call[0])).event as string);
  }

  it("serves current, then the last good copy when the database is down, then the error screen", async () => {
    vi.stubGlobal("fetch", postgrest14());
    const first = await loadMasterLessonTrio(1, 3);
    expect(first).toMatchObject({ ok: true, source: "current" });

    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("connect ECONNREFUSED"); }));
    const stale = await loadMasterLessonTrio(1, 3);
    expect(stale).toMatchObject({ ok: true, source: "stale", versionId: DRAFT_ID });
    expect(events()).toEqual(["academy_lesson_fetch_failed", "academy_lesson_served_stale"]);

    warn.mockClear();
    const never = await loadMasterLessonTrio(1, 4);
    expect(never.ok).toBe(false);
    expect(events()).toEqual(["academy_lesson_fetch_failed", "academy_lesson_error_screen"]);
  });

  it("reads the current pointer, then the version by id, so the PostgREST 14.5 embed bug cannot null a cohort", async () => {
    const fetchMock = postgrest14();
    vi.stubGlobal("fetch", fetchMock);
    const result = await loadMasterLessonTrio(1, 3);
    expect(result).toMatchObject({ ok: true, source: "current", versionId: DRAFT_ID });
    if (!result.ok) throw new Error(result.reason);
    expect(result.trio.maverick.lessonNumber).toBe(3);
    const urls = fetchMock.mock.calls.map((call) => decodeURIComponent(String(call[0])));
    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain("academy_lesson_current?module_number=eq.1&select=version_id");
    expect(urls[1]).toContain(`academy_lesson_versions?id=eq.${DRAFT_ID}&module_number=eq.1&select=`);
    expect(urls[1]).toContain("maverick:payload->maverick->2");
    expect(urls.some((url) => url.includes("academy_lesson_versions("))).toBe(false);
    expect(events()).toEqual([]);
  });

  it("the old embedded response shape (maverick null) is rejected, which is what prod showed", () => {
    const result = trioFromRow({ ...row(), maverick: null }, 1, 3, "current");
    expect(result).toEqual({ ok: false, reason: "maverick lesson 3 is missing or malformed." });
  });

  it("shows the error screen when there is no pointer row", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("[]", { status: 200 })));
    const result = await loadMasterLessonTrio(1, 3);
    expect(result).toEqual({ ok: false, reason: "No current version for module 1." });
  });

  it("does not ask for a draft in a production build", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const fetchMock = postgrest14();
    vi.stubGlobal("fetch", fetchMock);
    const result = await loadMasterLessonTrio(1, 3, { draft: "latest" });
    expect(result).toMatchObject({ ok: true, source: "current" });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("academy_lesson_current");
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test-project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon");
  });
});

describe("publishing drafts", () => {
  const workbook = readMasterWorkbookFile(MASTER_WORKBOOK_PATH, { moduleNumber: 1, knownMedia: new Set() });

  it("blocks a draft when a picture or clip is missing", async () => {
    const saveDraft = vi.fn();
    const result = await publishMasterDraft(workbook, { store: { findByHash: async () => null, saveDraft } });
    expect(result.ok).toBe(false);
    expect(result.blocked.length).toBeGreaterThan(0);
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it("stores held Lars art as pending, which blocks promote", async () => {
    const all = new Set([...workbook.media.images, ...workbook.media.audio].filter((name) => !isHeldLarsMedia(name)));
    const ready = readMasterWorkbookFile(MASTER_WORKBOOK_PATH, { moduleNumber: 1, knownMedia: all });
    const saveDraft = vi.fn(async (_hash: string, _payload: MasterPublishPayload) => DRAFT_ID);
    const result = await publishMasterDraft(ready, {
      store: { findByHash: async () => null, saveDraft },
      allowPending: isHeldLarsMedia,
    });
    expect(result).toMatchObject({ ok: true, wrote: true, versionId: DRAFT_ID });
    expect(result.pending.length).toBeGreaterThan(0);
    expect(result.pending.every(isHeldLarsMedia)).toBe(true);
    const [hash, payload] = saveDraft.mock.calls[0]!;
    expect(hash).toMatch(/\+pending:\d+$/);
    expect(promotionBlockers(payload, 1).length).toBe(result.pending.length);

    const again = await publishMasterDraft(ready, {
      store: { findByHash: async () => DRAFT_ID, saveDraft },
      allowPending: isHeldLarsMedia,
    });
    expect(again).toMatchObject({ ok: true, wrote: false, versionId: DRAFT_ID });
    expect(saveDraft).toHaveBeenCalledTimes(1);
  });

  it("lets only the accepted missing Pippa target through promote", async () => {
    const all = new Set([...workbook.media.images, ...workbook.media.audio].filter((name) => !isHeldLarsMedia(name)));
    const ready = readMasterWorkbookFile(MASTER_WORKBOOK_PATH, { moduleNumber: 1, knownMedia: all });
    const saveDraft = vi.fn(async (_hash: string, _payload: MasterPublishPayload) => DRAFT_ID);
    await publishMasterDraft(ready, {
      store: { findByHash: async () => null, saveDraft },
      allowPending: isHeldLarsMedia,
    });
    const payload = saveDraft.mock.calls[0]![1];
    const accepted = { ...payload, media: { ...payload.media, pending: ["images/pippa-celebrating-512.webp"] } };
    expect(promotionBlockers(accepted, 1)).toEqual([]);
    const other = {
      ...payload,
      media: { ...payload.media, pending: ["images/pippa-celebrating-512.webp", "images/other-missing.webp"] },
    };
    expect(promotionBlockers(other, 1)).toEqual(["Not in the bucket yet: images/other-missing.webp"]);
  });

  it("refuses a lesson that moved to another number", async () => {
    const all = new Set([...workbook.media.images, ...workbook.media.audio]);
    const ready = readMasterWorkbookFile(MASTER_WORKBOOK_PATH, { moduleNumber: 1, knownMedia: all });
    const first = await publishMasterDraft(ready);
    expect(first.ok).toBe(true);
    const previous = {
      schemaVersion: 1,
      moduleNumber: 1,
      mediaBase: BASE,
      media: { images: [], audio: [] },
      explorer: [{ ...ready.byCohort.explorer[0]!, lessonNumber: 2 }],
      pathfinder: [],
      maverick: [],
    } as MasterPublishPayload;
    const moved = await publishMasterDraft(ready, { previous });
    expect(moved.ok).toBe(false);
    expect(moved.blocked.join(" ")).toContain("moved from lesson 2 to 1");
  });
});

describe("media rules", () => {
  it("holds Lars art and caps sizes", () => {
    expect(isHeldLarsMedia("images/lars-waving.webp")).toBe(true);
    expect(isHeldLarsMedia("images/beat-ex-m1-l2-r2.webp")).toBe(true);
    expect(isHeldLarsMedia("images/beat-pf-m1-l2-r2.webp")).toBe(false);
    expect(imageByteCap("images/lars-a.webp")).toBe(90 * 1024);
    expect(imageByteCap("images/penny.webp")).toBe(120 * 1024);
  });

  it("plans uploads: held, missing, too large, first source wins", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "academy-media-"));
    mkdirSync(path.join(dir, "a"));
    mkdirSync(path.join(dir, "b"));
    writeFileSync(path.join(dir, "a", "one.webp"), Buffer.alloc(10));
    writeFileSync(path.join(dir, "b", "one.webp"), Buffer.alloc(20));
    writeFileSync(path.join(dir, "b", "big.webp"), Buffer.alloc(130 * 1024));
    const plan = planMediaUploads(
      ["images/one.webp", "images/big.webp", "images/gone.webp", "images/lars-x.webp"],
      { sourceDirs: ["a", "b"], cwd: dir },
    );
    const byPath = Object.fromEntries(plan.map((item) => [item.objectPath, item]));
    expect(byPath["images/one.webp"]).toMatchObject({ status: "upload", bytes: 10 });
    expect(byPath["images/big.webp"]?.status).toBe("too-large");
    expect(byPath["images/gone.webp"]?.status).toBe("no-source");
    expect(byPath["images/lars-x.webp"]?.status).toBe("held");
  });

  it("maps lesson pictures to the bucket only for database lessons", () => {
    const local = "/assets/illustrations/characters/pairs/beat-pf-m1-l1-r1.webp";
    expect(academyLessonImageSrc(local, "")).toBe(local);
    expect(academyLessonImageSrc(local, BASE)).toBe(`${BASE}/images/beat-pf-m1-l1-r1.webp`);
    expect(academyLessonImageSrc(undefined, BASE)).toBeUndefined();
  });
});
