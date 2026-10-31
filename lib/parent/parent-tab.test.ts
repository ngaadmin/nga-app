import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isParentTabEligible } from "@/lib/parent/parent-tab-eligibility";
import {
  PARENT_TAB_GATE_PASS_TTL_MS,
  parentTabGatePassValid,
  signParentTabGatePass,
} from "@/lib/parent/parent-tab-gate-pass";
import {
  PARENT_TAB_PIN_LOCKOUT_MS,
  PARENT_TAB_PIN_STORAGE_KEY,
  checkParentTabPin,
  clearParentTabPin,
  hasParentTabPin,
  parentTabPinLockedUntil,
  setParentTabPin,
} from "@/lib/parent/parent-tab-pin";
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

describe("parent tab PIN (device store)", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores a salted hash, never the PIN, keyed by parent", async () => {
    await setParentTabPin("parent-1", "4821");
    const raw = store.get(PARENT_TAB_PIN_STORAGE_KEY) ?? "";
    expect(raw).not.toContain("4821");
    const parsed = JSON.parse(raw);
    expect(Object.keys(parsed)).toEqual(["parent-1"]);
    expect(parsed["parent-1"].salt).toBeTruthy();
    expect(hasParentTabPin("parent-1")).toBe(true);
    expect(hasParentTabPin("parent-2")).toBe(false);
  });

  it("unlocks with the right PIN only", async () => {
    await setParentTabPin("parent-1", "4821");
    expect(await checkParentTabPin("parent-1", "4821")).toEqual({ ok: true });
    const wrong = await checkParentTabPin("parent-1", "1111");
    expect(wrong).toMatchObject({ ok: false, reason: "wrong", triesLeft: 4 });
  });

  it("locks out for 5 minutes after 5 wrong tries, then lets the parent retry", async () => {
    await setParentTabPin("parent-1", "4821");
    const start = 10_000_000;
    for (let index = 1; index <= 4; index += 1) {
      const result = await checkParentTabPin("parent-1", "0000", start);
      expect(result).toMatchObject({ reason: "wrong", triesLeft: 5 - index });
    }
    const fifth = await checkParentTabPin("parent-1", "0000", start);
    expect(fifth).toMatchObject({
      reason: "locked",
      lockedUntil: start + PARENT_TAB_PIN_LOCKOUT_MS,
    });
    // Even the right PIN is refused during the lockout.
    expect(
      await checkParentTabPin("parent-1", "4821", start + 60_000),
    ).toMatchObject({
      reason: "locked",
    });
    expect(parentTabPinLockedUntil("parent-1", start + 60_000)).toBe(
      start + PARENT_TAB_PIN_LOCKOUT_MS,
    );
    expect(
      await checkParentTabPin(
        "parent-1",
        "4821",
        start + PARENT_TAB_PIN_LOCKOUT_MS + 1,
      ),
    ).toEqual({ ok: true });
  });

  it("clears only that parent's PIN", async () => {
    await setParentTabPin("parent-1", "4821");
    await setParentTabPin("parent-2", "1234");
    clearParentTabPin("parent-1");
    expect(hasParentTabPin("parent-1")).toBe(false);
    expect(hasParentTabPin("parent-2")).toBe(true);
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
