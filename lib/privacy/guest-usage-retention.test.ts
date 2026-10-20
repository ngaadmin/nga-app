import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  GUEST_USAGE_RETENTION_MS,
  PURGE_GUEST_USAGE_RPC,
  deleteExpiredGuestUsageRows,
  type GuestUsageRow,
} from "@/lib/privacy/guest-usage-retention";

const now = new Date("2026-10-20T03:00:00.000Z");

function atAge(ageMs: number, id: number, username: string): GuestUsageRow {
  return {
    id,
    username,
    createdAt: new Date(now.getTime() - ageMs).toISOString(),
  };
}

describe("deleteExpiredGuestUsageRows", () => {
  it("deletes guest rows older than 30 days", () => {
    const rows = [
      atAge(GUEST_USAGE_RETENTION_MS + 1, 1, "Penny1842"),
      atAge(GUEST_USAGE_RETENTION_MS + 24 * 60 * 60 * 1000, 2, "Penny9001"),
    ];

    const { kept, removed } = deleteExpiredGuestUsageRows(rows, ["River"], now);

    expect(removed.map((row) => row.id)).toEqual([1, 2]);
    expect(kept).toEqual([]);
  });

  it("keeps newer guest rows", () => {
    const rows = [
      atAge(GUEST_USAGE_RETENTION_MS, 1, "Penny1842"),
      atAge(GUEST_USAGE_RETENTION_MS - 1, 2, "Penny1842"),
      atAge(0, 3, "Penny9001"),
    ];

    const { kept, removed } = deleteExpiredGuestUsageRows(rows, [], now);

    expect(removed).toEqual([]);
    expect(kept.map((row) => row.id)).toEqual([1, 2, 3]);
  });

  it("never deletes real-account rows at any age", () => {
    const profiles = ["River", "amber4", null];
    const rows = [
      atAge(0, 1, "River"),
      atAge(GUEST_USAGE_RETENTION_MS * 20, 2, "River"),
      atAge(GUEST_USAGE_RETENTION_MS + 1, 3, "river"),
      atAge(GUEST_USAGE_RETENTION_MS * 40, 4, "AMBER4"),
      atAge(GUEST_USAGE_RETENTION_MS + 1, 5, "Penny1842"),
    ];

    const { kept, removed } = deleteExpiredGuestUsageRows(rows, profiles, now);

    expect(removed.map((row) => row.id)).toEqual([5]);
    expect(kept.map((row) => row.id)).toEqual([1, 2, 3, 4]);
  });
});

describe("purge_guest_usage_events", () => {
  it("deletes only unmatched usernames older than 30 days, in one statement", () => {
    const sql = readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20261020180000_purge_guest_usage_events.sql",
      ),
      "utf8",
    );

    expect(sql.match(/\bDELETE\s+FROM\b/gi)).toHaveLength(1);
    expect(sql).toContain(`FUNCTION public.${PURGE_GUEST_USAGE_RPC}()`);
    expect(sql).toContain("created_at < now() - interval '30 days'");
    expect(sql).toContain("NOT EXISTS");
    expect(sql).toContain(
      "lower(profiles.username::text) = lower(usage_events.username)",
    );
    expect(sql).toContain("usage_events_created_at_idx");
  });
});
