import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkLaunchpadVenturePayload } from "@/lib/launchpad/content/check-payload";
import { launchpadContentDbEnabled } from "@/lib/launchpad/content/content-flag";
import { launchpadContentHash } from "@/lib/launchpad/content/content-hash";
import type { LaunchpadContentSource, LaunchpadVersionRow } from "@/lib/launchpad/content/content-sources";
import {
  launchpadContentSourceFor,
  launchpadDraftSelector,
  loadLaunchpadVenture,
  resetLaunchpadContentCacheForTests,
} from "@/lib/launchpad/content/fetch-published";
import { movedTasks, publishLaunchpadDraft } from "@/lib/launchpad/content/publish";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { launchpadPublishV4Sql, launchpadSeedSql } from "@/lib/launchpad/content/seed/seed-sql";
import type { LaunchpadVenturePayload } from "@/lib/launchpad/content/types";

const SEED = launchpadTestVentureSeed("dog-walking");
const VERSION = "11111111-1111-4111-8111-111111111111";

/** Deep copy as a plain object we can break. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tests break the payload on purpose
function mutable(): any {
  return JSON.parse(JSON.stringify(SEED));
}

function reason(value: unknown): string {
  const r = checkLaunchpadVenturePayload(value, "dog-walking");
  if (r.ok) throw new Error("expected a rejection");
  return r.reason;
}

afterEach(() => {
  resetLaunchpadContentCacheForTests();
  vi.restoreAllMocks();
});

describe("launchpad payload schema", () => {
  it("accepts the bundled seed, seven floors", () => {
    const r = checkLaunchpadVenturePayload(SEED, "dog-walking");
    expect(r.ok).toBe(true);
    expect(SEED.floors).toHaveLength(7);
    expect(SEED.floors.map((floor) => floor.name)).toEqual([
      "Vision and Goals",
      "Planning",
      "Getting Ready",
      "Sales",
      "Delivery",
      "Budgeting",
      "Growing",
    ]);
  });

  it("rejects the wrong schema version or venture", () => {
    expect(reason({ ...mutable(), schemaVersion: 99 })).toMatch(/schema/i);
    expect(checkLaunchpadVenturePayload(SEED, "lemonade-stand").ok).toBe(false);
  });

  it("rejects levels out of order", () => {
    const p = mutable();
    p.floors[1].level = 3;
    expect(reason(p)).toMatch(/level/i);
  });

  it("rejects an unknown floor type", () => {
    const p = mutable();
    p.floors[0].floorType = "atrium";
    expect(reason(p)).toMatch(/floorType|floor type/i);
  });

  it("rejects a floor with no plaques or too many", () => {
    const none = mutable();
    none.floors[0].silvers = [];
    expect(reason(none)).toMatch(/silver/i);
    const many = mutable();
    many.floors[2].silvers = Array.from({ length: 7 }, (_, i) => ({ ...many.floors[2].silvers[0], id: `x-${i}` }));
    expect(reason(many)).toMatch(/silver/i);
  });

  it("rejects a plaque with no doors and a door with no tasks", () => {
    const noDoors = mutable();
    noDoors.floors[0].silvers[1].bronzes = [];
    expect(reason(noDoors)).toMatch(/bronze/i);
    const noTasks = mutable();
    noTasks.floors[0].silvers[1].bronzes[0].tasks = [];
    expect(reason(noTasks)).toMatch(/task/i);
  });

  it("rejects duplicate ids", () => {
    const p = mutable();
    p.floors[0].silvers[0].bronzes[1].id = p.floors[0].silvers[0].bronzes[0].id;
    expect(reason(p)).toMatch(/used twice/);
  });

  it("rejects unknown task screen types and missing slots", () => {
    const unknown = mutable();
    unknown.floors[0].silvers[0].bronzes[0].tasks[0].screens[0].type = "video";
    expect(reason(unknown)).toMatch(/screen/i);
    const text = mutable();
    text.floors[0].silvers[0].bronzes[0].tasks[0].screens[0] = { id: "s-text", type: "text" };
    expect(reason(text)).toMatch(/body/i);
    const list = mutable();
    list.floors[0].silvers[0].bronzes[0].tasks[0].screens[0] = { id: "s-list", type: "checklist", items: [] };
    expect(reason(list)).toMatch(/item/i);
  });

  it("accepts text and checklist screens", () => {
    const p = mutable();
    // L3 keeps placeholder content (L1 and L2 screens feed their wrap-ups).
    p.floors[2].silvers[0].bronzes[0].tasks[0].screens = [
      { id: "t-text", type: "text", heading: "Why it matters", body: "Pick something you enjoy." },
      { id: "t-list", type: "checklist", items: ["Ask a neighbor", "Price a walk"] },
    ];
    expect(checkLaunchpadVenturePayload(p, "dog-walking").ok).toBe(true);
  });

  it("bans NGA and XP in copy", () => {
    const nga = mutable();
    nga.floors[0].gold.title = "Welcome to NGA";
    expect(reason(nga)).toMatch(/NGA/);
    const xp = mutable();
    xp.floors[0].silvers[0].title = "Earn 10 XP";
    expect(reason(xp)).toMatch(/XP/);
  });
});

describe("launchpad content flag and source", () => {
  it("defaults off and accepts 1 or true", () => {
    expect(launchpadContentDbEnabled({})).toBe(false);
    expect(launchpadContentDbEnabled({ VERCEL_ENV: "preview" })).toBe(false);
    expect(launchpadContentDbEnabled({ LAUNCHPAD_CONTENT_DB: "1" })).toBe(true);
    expect(launchpadContentDbEnabled({ NEXT_PUBLIC_LAUNCHPAD_CONTENT_DB: "true" })).toBe(true);
    expect(launchpadContentDbEnabled({ LAUNCHPAD_CONTENT_DB: "0" })).toBe(false);
  });

  it("uses the seed unless the flag is on and the venture is listed", () => {
    expect(launchpadContentSourceFor("dog-walking", {}).name).toBe("seed");
    // LAUNCHPAD_DB_VENTURES is empty for now, so even the flag keeps the seed.
    expect(launchpadContentSourceFor("dog-walking", { LAUNCHPAD_CONTENT_DB: "1" }).name).toBe("seed");
  });

  it("honors drafts on preview only", () => {
    expect(launchpadDraftSelector(VERSION, {})).toEqual({ kind: "current" });
    expect(launchpadDraftSelector(VERSION, { VERCEL_ENV: "production" })).toEqual({ kind: "current" });
    expect(launchpadDraftSelector(VERSION, { VERCEL_ENV: "preview" })).toEqual({ kind: "draft", id: VERSION });
    expect(launchpadDraftSelector("latest", { VERCEL_ENV: "preview" })).toEqual({ kind: "draft", id: "latest" });
    expect(launchpadDraftSelector("nope", { VERCEL_ENV: "preview" })).toEqual({ kind: "current" });
  });
});

function fakeDb(reads: Array<LaunchpadVersionRow | Error | null>): LaunchpadContentSource {
  return {
    name: "db",
    read: vi.fn(async () => {
      const next = reads.shift();
      if (next instanceof Error) throw next;
      return next ?? null;
    }),
  };
}

const row = (payload: unknown = SEED): LaunchpadVersionRow => ({
  id: VERSION,
  contentHash: launchpadContentHash(payload as LaunchpadVenturePayload),
  payload,
});

describe("loadLaunchpadVenture fallback order", () => {
  it("serves the seed through the validation path", async () => {
    const load = await loadLaunchpadVenture("dog-walking");
    expect(load.ok && load.source).toBe("seed");
    expect(load.ok && load.venture.floors.length).toBe(7);
  });

  it("serves current, then the last good copy, then an error", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const source = fakeDb([row(), new Error("down")]);
    const first = await loadLaunchpadVenture("dog-walking", { source });
    expect(first.ok && first.source).toBe("current");
    const second = await loadLaunchpadVenture("dog-walking", { source });
    expect(second.ok && second.source).toBe("stale");
    resetLaunchpadContentCacheForTests();
    const third = await loadLaunchpadVenture("dog-walking", { source: fakeDb([new Error("down")]) });
    expect(third.ok).toBe(false);
  });

  it("rejects an invalid stored payload and never serves it", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const bad = { ...mutable(), floors: [] };
    const load = await loadLaunchpadVenture("dog-walking", { source: fakeDb([row(bad)]) });
    expect(load.ok).toBe(false);
  });
});

describe("launchpad publish", () => {
  it("dedupes by hash and never writes current", async () => {
    const saveDraft = vi.fn(async () => VERSION);
    const fresh = await publishLaunchpadDraft(SEED, { ventureId: "dog-walking", store: { findByHash: async () => null, saveDraft } });
    expect(fresh).toMatchObject({ ok: true, wrote: true, versionId: VERSION });
    const again = await publishLaunchpadDraft(SEED, { ventureId: "dog-walking", store: { findByHash: async () => VERSION, saveDraft } });
    expect(again).toMatchObject({ ok: true, wrote: false, versionId: VERSION });
    expect(saveDraft).toHaveBeenCalledTimes(1);
  });

  it("blocks a task moved to another door", async () => {
    const next = mutable();
    const [a, b] = next.floors[0].silvers[0].bronzes;
    b.tasks.push(a.tasks.pop());
    expect(movedTasks(SEED, next)).toHaveLength(1);
    const r = await publishLaunchpadDraft(next, { ventureId: "dog-walking", previous: SEED });
    expect(r.ok).toBe(false);
  });
});

describe("launchpad seed SQL", () => {
  it("the checked-in seed file matches the generator", () => {
    const file = readFileSync(path.join(process.cwd(), "supabase/seeds/launchpad_test_venture_seed.sql"), "utf8");
    expect(file).toBe(launchpadSeedSql(launchpadTestVentureSeed()));
  });

  it("the checked-in v4 publish file matches the generator", () => {
    const file = readFileSync(path.join(process.cwd(), "supabase/seeds/launchpad_venture_publish_v4.sql"), "utf8");
    expect(file).toBe(launchpadPublishV4Sql([launchpadTestVentureSeed()]));
  });

  it("is idempotent and only touches the two new tables", () => {
    const sql = launchpadPublishV4Sql([SEED]);
    const statements = sql.replace(/\$lp_seed\$[\s\S]*\$lp_seed\$/g, "''");
    expect(sql).toMatch(/on conflict \(venture_id, content_hash\) do nothing/);
    expect(sql).toMatch(/on conflict \(venture_id\) do update/);
    expect(statements).not.toMatch(/\b(create|alter|drop|delete|truncate|grant|revoke)\b/i);
    const tables = [...sql.matchAll(/(?:insert into|update|from)\s+public\.(\w+)/g)].map((m) => m[1]);
    expect(new Set(tables)).toEqual(new Set(["launchpad_venture_versions", "launchpad_venture_current"]));
  });
});

describe("published v4 row loads as the bundled seed", () => {
  it("returns a payload deep-equal to the seed when the DB source serves that row", async () => {
    const seed = launchpadTestVentureSeed();
    const sql = readFileSync(path.join(process.cwd(), "supabase/seeds/launchpad_venture_publish_v4.sql"), "utf8");
    const stored = sql.match(/\$lp_seed\$([\s\S]*)\$lp_seed\$/)?.[1];
    expect(stored).toBeTruthy();
    const payload = JSON.parse(stored ?? "");
    const source: LaunchpadContentSource = {
      name: "db",
      read: async () => ({
        id: VERSION,
        contentHash: launchpadContentHash(payload),
        payload,
      }),
    };
    const load = await loadLaunchpadVenture("dog-walking", { source });
    expect(load.ok).toBe(true);
    if (!load.ok) return;
    expect(load.source).toBe("current");
    expect(load.venture).toEqual(seed);
    expect(load.venture.schemaVersion).toBe(4);
    expect(load.venture.floors).toHaveLength(7);
    expect(load.venture.surface).toBeTruthy();
  });
});

describe("launchpad migration", () => {
  const sql = readFileSync(
    path.join(process.cwd(), "supabase/migrations/20261104090000_launchpad_venture_content.sql"),
    "utf8",
  )
    .split("\n")
    .filter((l) => !l.startsWith("--"))
    .join("\n");

  it("is additive: no alter of other tables, no drop table, no data writes", () => {
    expect(sql).not.toMatch(/drop\s+table/i);
    expect(sql).not.toMatch(/\b(insert|update|delete|truncate)\b/i);
    for (const m of sql.matchAll(/alter table\s+([\w.]+)/gi))
      expect(["public.launchpad_venture_versions", "public.launchpad_venture_current"]).toContain(m[1]);
    expect(sql.match(/create table if not exists/g)).toHaveLength(2);
  });
});
