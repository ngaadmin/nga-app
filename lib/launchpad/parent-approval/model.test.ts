import { describe, expect, it } from "vitest";
import { copyMatrix } from "@/constants/copyMatrix";
import {
  APPROVAL_KEY_NO,
  APPROVAL_KEY_REQUESTED,
  APPROVAL_KEY_YES,
  PARENT_APPROVAL_GATED_BRONZE_ID,
} from "@/lib/launchpad/parent-approval/config";
import {
  isVentureId,
  parentApprovalRequestedAt,
  parentApprovalStatus,
  withApprovalDecision,
  withApprovalRequested,
} from "@/lib/launchpad/parent-approval/model";
import { salesDoors } from "@/lib/launchpad/content/sales/screens";

const T1 = "2026-11-18T10:00:00.000Z";
const T2 = "2026-11-18T11:00:00.000Z";
const T3 = "2026-11-18T12:00:00.000Z";

describe("parentApprovalStatus", () => {
  it("is none for an empty or missing map", () => {
    expect(parentApprovalStatus(null)).toBe("none");
    expect(parentApprovalStatus(undefined)).toBe("none");
    expect(parentApprovalStatus({})).toBe("none");
    expect(parentApprovalStatus({ "l1-s1": T1 })).toBe("none");
  });

  it("is pending once requested", () => {
    expect(parentApprovalStatus({ [APPROVAL_KEY_REQUESTED]: T1 })).toBe("pending");
  });

  it("is declined after a not now and approved after a yes", () => {
    expect(parentApprovalStatus({ [APPROVAL_KEY_REQUESTED]: T1, [APPROVAL_KEY_NO]: T2 })).toBe("declined");
    expect(parentApprovalStatus({ [APPROVAL_KEY_REQUESTED]: T1, [APPROVAL_KEY_YES]: T2 })).toBe("approved");
  });

  it("lets the parent change a not now to a yes, and the latest answer wins", () => {
    expect(
      parentApprovalStatus({ [APPROVAL_KEY_REQUESTED]: T1, [APPROVAL_KEY_NO]: T2, [APPROVAL_KEY_YES]: T3 }),
    ).toBe("approved");
  });

  it("ignores values that are not timestamps", () => {
    expect(parentApprovalStatus({ [APPROVAL_KEY_REQUESTED]: "soon" })).toBe("none");
    expect(parentApprovalStatus({ [APPROVAL_KEY_YES]: 5 })).toBe("none");
  });
});

describe("approval updates", () => {
  it("requests once and keeps unrelated milestones", () => {
    const first = withApprovalRequested({ "l1-s1": T1 }, T2);
    expect(first).toEqual({ "l1-s1": T1, [APPROVAL_KEY_REQUESTED]: T2 });
    const again = withApprovalRequested(first, T3);
    expect(parentApprovalRequestedAt(again)).toBe(T2);
  });

  it("records a decision against the request", () => {
    const yes = withApprovalDecision({ [APPROVAL_KEY_REQUESTED]: T1 }, "yes", T2);
    expect(parentApprovalStatus(yes)).toBe("approved");
    const no = withApprovalDecision({ [APPROVAL_KEY_REQUESTED]: T1 }, "no", T2);
    expect(parentApprovalStatus(no)).toBe("declined");
  });

  it("validates venture ids", () => {
    expect(isVentureId("dog-walking")).toBe(true);
    expect(isVentureId("Dog Walking")).toBe(false);
    expect(isVentureId(undefined)).toBe(false);
  });
});

describe("the stop sits in front of Tell people about it", () => {
  it("gates the Level 4 door named in the sales content", () => {
    const ids = salesDoors().map((door) => door.id);
    expect(ids).toContain(PARENT_APPROVAL_GATED_BRONZE_ID);
    expect(PARENT_APPROVAL_GATED_BRONZE_ID).toBe("l4-s1-b4");
    expect(salesDoors().find((door) => door.id === PARENT_APPROVAL_GATED_BRONZE_ID)?.title).toBe("Tell people about it");
  });
});

describe("approval copy rules", () => {
  const strings: string[] = [];
  const walk = (value: unknown) => {
    if (typeof value === "string") strings.push(value);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk(copyMatrix.launchpadParentApproval);

  it("has copy", () => {
    expect(strings.length).toBeGreaterThan(10);
  });

  it("uses no em dashes, banned words or level medal words", () => {
    for (const text of strings) {
      expect(text).not.toMatch(/[\u2014\u2013]/);
      expect(text).not.toMatch(/\bNGA\b/);
      expect(text).not.toMatch(/\b(lego|xp)\b/i);
      expect(text).not.toMatch(/\b(bronze|silver|gold)\b/i);
    }
  });

  it("uses US spelling", () => {
    for (const text of strings) {
      expect(text).not.toMatch(/\b(colour|favourite|organis|centre|programme)/i);
    }
  });
});
