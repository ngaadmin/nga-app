import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  isReservedGuestUsername,
  RESERVED_GUEST_USERNAME_PATTERN,
} from "@/lib/onboarding/reserved-guest-username";

describe("reserved guest usernames", () => {
  it("blocks Penny#### and PennyX#### in any letter case", () => {
    expect(isReservedGuestUsername("Penny1842")).toBe(true);
    expect(isReservedGuestUsername("penny0001")).toBe(true);
    expect(isReservedGuestUsername("PENNY1842")).toBe(true);
    expect(isReservedGuestUsername(" Penny1842 ")).toBe(true);
    expect(isReservedGuestUsername("PennyX0042")).toBe(true);
    expect(isReservedGuestUsername("pennyx0042")).toBe(true);

    expect(isReservedGuestUsername("PennyFan22")).toBe(false);
    expect(isReservedGuestUsername("River")).toBe(false);
    expect(isReservedGuestUsername("Penny184")).toBe(false);
    expect(isReservedGuestUsername("Penny18422")).toBe(false);
    expect(isReservedGuestUsername("pennytest")).toBe(false);
    expect(RESERVED_GUEST_USERNAME_PATTERN.test("amber4")).toBe(false);
  });

  it("is enforced by a trigger and does not rewrite existing profiles", () => {
    const sql = readFileSync(
      path.join(process.cwd(), "supabase/migrations/20261021120000_guest_event_counts.sql"),
      "utf8",
    );

    expect(sql).toContain("'^pennyx?[0-9]{4}$'");
    expect(sql).toContain("profiles_reject_reserved_guest_username");
    expect(sql).toContain("BEFORE INSERT OR UPDATE OF username");
    expect(sql).toContain("TG_OP = 'INSERT'");
    expect(sql).toContain("IS DISTINCT FROM");
    expect(sql).not.toMatch(/UPDATE\s+public\.profiles/i);
    expect(sql).not.toMatch(/DELETE\s+FROM\s+public\.profiles/i);
  });
});
