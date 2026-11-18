import { afterEach, describe, expect, it, vi } from "vitest";
import { launchpadContentHash } from "@/lib/launchpad/content/content-hash";
import { dbContentSource, seedContentSource, type LaunchpadContentSource, type LaunchpadVersionRow } from "@/lib/launchpad/content/content-sources";
import {
  launchpadLearnerRoleAllowed,
  launchpadPinnedVersionMatches,
  loadDashboardLaunchpadVenture,
} from "@/lib/launchpad/content/dashboard-source";
import { resetLaunchpadContentCacheForTests } from "@/lib/launchpad/content/fetch-published";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";

const SEED = launchpadTestVentureSeed("dog-walking");
const VERSION = "11111111-1111-4111-8111-111111111111";
const HASH = launchpadContentHash(SEED);

function row(): LaunchpadVersionRow {
  return { id: VERSION, contentHash: HASH, payload: SEED };
}

function fakeDb(reads: Array<LaunchpadVersionRow | null>): LaunchpadContentSource {
  return {
    name: "db",
    read: vi.fn(async () => reads.shift() ?? null),
  };
}

afterEach(() => {
  resetLaunchpadContentCacheForTests();
  vi.restoreAllMocks();
});

describe("launchpad learner gate", () => {
  it("allows a child and refuses a parent, a teacher, and a guest", () => {
    expect(launchpadLearnerRoleAllowed("child")).toBe(true);
    expect(launchpadLearnerRoleAllowed("parent_master")).toBe(false);
    expect(launchpadLearnerRoleAllowed("teacher")).toBe(false);
    expect(launchpadLearnerRoleAllowed(null)).toBe(false);
    expect(launchpadLearnerRoleAllowed(undefined)).toBe(false);
  });
});

describe("dashboard launchpad content", () => {
  it("fails closed in production when the flag is off and does not read the seed", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const seedRead = vi.spyOn(seedContentSource, "read");
    const dbRead = vi.spyOn(dbContentSource, "read");
    const load = await loadDashboardLaunchpadVenture("dog-walking", {
      VERCEL_ENV: "production",
      LAUNCHPAD_CONTENT_DB: "0",
    });
    expect(load.ok).toBe(false);
    expect(seedRead).not.toHaveBeenCalled();
    expect(dbRead).not.toHaveBeenCalled();
  });

  it("fails closed in production when the database has no current row", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const seedRead = vi.spyOn(seedContentSource, "read");
    const load = await loadDashboardLaunchpadVenture(
      "dog-walking",
      { VERCEL_ENV: "production", NEXT_PUBLIC_VERCEL_ENV: "production", LAUNCHPAD_CONTENT_DB: "1" },
      fakeDb([null]),
    );
    expect(load.ok).toBe(false);
    expect(seedRead).not.toHaveBeenCalled();
  });

  it("serves the database row in production when the flag is on", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const load = await loadDashboardLaunchpadVenture(
      "dog-walking",
      { VERCEL_ENV: "production", LAUNCHPAD_CONTENT_DB: "1" },
      fakeDb([row()]),
    );
    expect(load.ok && load.source).toBe("current");
    expect(load.ok && load.versionId).toBe(VERSION);
  });

  it("rejects a row that does not match the pinned version id or content hash", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(launchpadPinnedVersionMatches(VERSION, HASH, {})).toBe(true);
    expect(launchpadPinnedVersionMatches(VERSION, HASH, { LAUNCHPAD_PINNED_VERSION_ID: VERSION })).toBe(true);
    expect(launchpadPinnedVersionMatches(VERSION, HASH, { LAUNCHPAD_PINNED_VERSION_ID: HASH })).toBe(true);
    const load = await loadDashboardLaunchpadVenture(
      "dog-walking",
      { VERCEL_ENV: "production", LAUNCHPAD_CONTENT_DB: "1", LAUNCHPAD_PINNED_VERSION_ID: "other-version" },
      fakeDb([row()]),
    );
    expect(load.ok).toBe(false);
  });

  it("preview reads the database, the same as today", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const read = vi.spyOn(dbContentSource, "read").mockResolvedValue(row());
    const load = await loadDashboardLaunchpadVenture("dog-walking", { VERCEL_ENV: "preview" });
    expect(read).toHaveBeenCalled();
    expect(load.ok && load.source).toBe("current");
  });
});
