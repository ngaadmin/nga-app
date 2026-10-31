import { describe, expect, it, vi } from "vitest";
import { isParentTabEligible } from "@/lib/parent/parent-tab-eligibility";
import {
  PARENT_TAB_GATE_PASS_TTL_MS,
  parentTabGatePassValid,
  signParentTabGatePass,
} from "@/lib/parent/parent-tab-gate-pass";
import {
  PARENT_TAB_PIN_ITERATIONS,
  PARENT_TAB_PIN_LOCKOUT_MS,
  PARENT_TAB_PIN_MAX_TRIES,
  isParentTabPin,
  nextParentTabPinCounters,
  parentTabPinLockActive,
} from "@/lib/parent/parent-tab-pin";
import {
  hashParentTabPin,
  newParentTabPinHash,
  parentTabPinHashesMatch,
} from "@/lib/parent/parent-tab-pin-hash";
import { DASHBOARD_NAV_ITEMS } from "@/lib/dashboard/navigation";
import {
  PARENT_TAB_NAV_ITEM,
  withParentTabNavItem,
} from "@/lib/parent/parent-tab-nav";
import { explicitProfileAvatarId } from "@/lib/dashboard/profile-avatar";

const active = { accountRole: "child", accountStatus: "active" };

describe("isParentTabEligible", () => {
  it("shows the tab for a parent with an active linked child", () => {
    expect(
      isParentTabEligible({
        accountRole: "parent_master",
        linkedChildren: [active],
      }),
    ).toBe(true);
  });

  it("hides it for a parent without linked children", () => {
    expect(
      isParentTabEligible({ accountRole: "parent_master", linkedChildren: [] }),
    ).toBe(false);
  });

  it("hides it when no linked child is active yet", () => {
    expect(
      isParentTabEligible({
        accountRole: "parent_master",
        linkedChildren: [
          { accountRole: "child", accountStatus: "pending_consent" },
          { accountRole: "child", accountStatus: "declined" },
        ],
      }),
    ).toBe(false);
  });

  it("hides it for learners, adults without oversight, teachers and guests", () => {
    for (const accountRole of [
      "child",
      "learner",
      "adult",
      "teacher",
      null,
      undefined,
    ]) {
      expect(
        isParentTabEligible({ accountRole, linkedChildren: [active] }),
      ).toBe(false);
    }
  });
});

describe("parent tab gate pass", () => {
  it("accepts a fresh pass for the same user only", () => {
    const pass = signParentTabGatePass("parent-1", 1_000);
    expect(parentTabGatePassValid(pass, "parent-1", 2_000)).toBe(true);
    expect(parentTabGatePassValid(pass, "parent-2", 2_000)).toBe(false);
  });

  it("expires", () => {
    const pass = signParentTabGatePass("parent-1", 1_000);
    expect(
      parentTabGatePassValid(
        pass,
        "parent-1",
        1_000 + PARENT_TAB_GATE_PASS_TTL_MS + 1,
      ),
    ).toBe(false);
  });

  it("rejects tampered or missing passes", () => {
    const pass = signParentTabGatePass("parent-1", 1_000);
    const [scope, user, exp, mac] = pass.split(".");
    expect(
      parentTabGatePassValid(
        `${scope}.${user}.${Number(exp) + 1}.${mac}`,
        "parent-1",
        2_000,
      ),
    ).toBe(false);
    expect(
      parentTabGatePassValid(`other.${user}.${exp}.${mac}`, "parent-1", 2_000),
    ).toBe(false);
    expect(parentTabGatePassValid("", "parent-1", 2_000)).toBe(false);
    expect(parentTabGatePassValid(undefined, "parent-1", 2_000)).toBe(false);
  });
});

vi.mock("server-only", () => ({}));

describe("parent tab PIN counters (server rules)", () => {
  const now = 1_800_000_000_000;
  const clean = { failedTries: 0, lockedUntil: null };

  it("adds a try per miss and locks for 5 minutes on the 5th", () => {
    let counters: { failedTries: number; lockedUntil: number | null } = clean;
    for (let miss = 1; miss <= 4; miss += 1) {
      counters = nextParentTabPinCounters(counters, false, now);
      expect(counters).toEqual({ failedTries: miss, lockedUntil: null });
    }
    counters = nextParentTabPinCounters(counters, false, now);
    expect(counters.failedTries).toBe(PARENT_TAB_PIN_MAX_TRIES);
    expect(counters.lockedUntil).toBe(now + PARENT_TAB_PIN_LOCKOUT_MS);
    expect(parentTabPinLockActive(counters, now + 1000)).toBe(true);
    expect(
      parentTabPinLockActive(counters, now + PARENT_TAB_PIN_LOCKOUT_MS),
    ).toBe(false);
  });

  it("starts over after the lock runs out, and a match clears everything", () => {
    const expired = { failedTries: 5, lockedUntil: now - 1 };
    expect(nextParentTabPinCounters(expired, false, now)).toEqual({
      failedTries: 1,
      lockedUntil: null,
    });
    expect(
      nextParentTabPinCounters({ failedTries: 3, lockedUntil: null }, true, now),
    ).toEqual(clean);
  });

  it("only accepts 4 digits", () => {
    expect(isParentTabPin("1234")).toBe(true);
    for (const bad of ["123", "12345", "12a4", "", " 123"]) {
      expect(isParentTabPin(bad)).toBe(false);
    }
  });
});

describe("parent tab PIN hash (server)", () => {
  it("salts with PBKDF2 and compares in constant time", async () => {
    const first = await newParentTabPinHash("4821");
    const second = await newParentTabPinHash("4821");
    expect(first.iterations).toBe(PARENT_TAB_PIN_ITERATIONS);
    expect(first.hash).not.toContain("4821");
    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
    const again = await hashParentTabPin("4821", first.salt, first.iterations);
    expect(parentTabPinHashesMatch(again, first.hash)).toBe(true);
    const wrong = await hashParentTabPin("4822", first.salt, first.iterations);
    expect(parentTabPinHashesMatch(wrong, first.hash)).toBe(false);
    expect(parentTabPinHashesMatch("", first.hash)).toBe(false);
  });
});

describe("parent tab nav item", () => {
  it("adds Parent after the other tabs only when eligible", () => {
    expect(
      withParentTabNavItem(DASHBOARD_NAV_ITEMS, false).map((item) => item.id),
    ).not.toContain("parent");
    const items = withParentTabNavItem(DASHBOARD_NAV_ITEMS, true);
    expect(items.at(-1)?.id).toBe("parent");
    expect(items).toHaveLength(DASHBOARD_NAV_ITEMS.length + 1);
    expect(withParentTabNavItem(items, true)).toHaveLength(items.length);
  });

  it("matches the Parent route only", () => {
    expect(PARENT_TAB_NAV_ITEM.matchesPath?.("/dashboard/parent")).toBe(true);
    expect(PARENT_TAB_NAV_ITEM.matchesPath?.("/dashboard/settings")).toBe(
      false,
    );
  });
});

describe("explicitProfileAvatarId", () => {
  it("is null until this profile picks a picture, so a parent never defaults to Lars", () => {
    expect(explicitProfileAvatarId(null, "parent-1")).toBeNull();
    expect(
      explicitProfileAvatarId(
        JSON.stringify({ "child-1": "lars" }),
        "parent-1",
      ),
    ).toBeNull();
    expect(
      explicitProfileAvatarId(
        JSON.stringify({ "parent-1": "holly" }),
        "parent-1",
      ),
    ).toBe("holly");
  });
});
