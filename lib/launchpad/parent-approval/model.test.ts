import { describe, expect, it } from "vitest";
import { copyMatrix } from "@/constants/copyMatrix";
import {
  APPROVAL_KEY_EMAIL_SENT,
  APPROVAL_KEY_NO,
  APPROVAL_KEY_REMINDER_SENT,
  APPROVAL_KEY_REQUESTED,
  APPROVAL_KEY_YES,
  PARENT_APPROVAL_GATED_BRONZE_ID,
} from "@/lib/launchpad/parent-approval/config";
import {
  approvalEmailAction,
  isVentureId,
  learnerApprovalGate,
  learnerSkipsStopForAge,
  NO_APPROVAL_GATE,
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

describe("learnerApprovalGate (hard stop)", () => {
  it("does not let a learner with no linked parent skip the stop, and sends nothing", () => {
    const gate = learnerApprovalGate(false, null);
    expect(gate.view).toEqual({ applies: true, status: "pending" });
    expect(gate.needsRequest).toBe(false);
    // Even a stored yes does not open the door when no parent is linked.
    expect(learnerApprovalGate(false, { [APPROVAL_KEY_REQUESTED]: T1, [APPROVAL_KEY_YES]: T2 }).view.status).toBe("pending");
    expect(gate.view).not.toEqual(NO_APPROVAL_GATE);
  });

  it("asks a linked parent once, then follows their answer", () => {
    expect(learnerApprovalGate(true, null)).toEqual({ view: { applies: true, status: "none" }, needsRequest: true });
    expect(learnerApprovalGate(true, { [APPROVAL_KEY_REQUESTED]: T1 })).toEqual({
      view: { applies: true, status: "pending" },
      needsRequest: false,
    });
    expect(learnerApprovalGate(true, { [APPROVAL_KEY_REQUESTED]: T1, [APPROVAL_KEY_YES]: T2 }).view.status).toBe("approved");
    expect(learnerApprovalGate(true, { [APPROVAL_KEY_REQUESTED]: T1, [APPROVAL_KEY_NO]: T2 }).view.status).toBe("declined");
  });
});

describe("learnerSkipsStopForAge (the 16+ skip)", () => {
  it("skips only when sign-up recorded an age check that said 16 or over", () => {
    expect(learnerSkipsStopForAge({ parent_approval_required: false, age_checked_at: T1 })).toBe(true);
  });

  it("keeps the stop for under 16, unknown, or no age check on record", () => {
    expect(learnerSkipsStopForAge({ parent_approval_required: true, age_checked_at: T1 })).toBe(false);
    expect(learnerSkipsStopForAge({ parent_approval_required: null, age_checked_at: T1 })).toBe(false);
    expect(learnerSkipsStopForAge({ parent_approval_required: false, age_checked_at: null })).toBe(false);
    expect(learnerSkipsStopForAge({ parent_approval_required: false, age_checked_at: "not a date" })).toBe(false);
    expect(learnerSkipsStopForAge({})).toBe(false);
    expect(learnerSkipsStopForAge(null)).toBe(false);
    expect(learnerSkipsStopForAge(undefined)).toBe(false);
  });
});

describe("approvalEmailAction (request email, then one reminder)", () => {
  const t0 = Date.parse(T1);
  const hour = 60 * 60 * 1000;
  const sent = { [APPROVAL_KEY_REQUESTED]: T1, [APPROVAL_KEY_EMAIL_SENT]: T1 };

  it("sends nothing before a request exists or after a parent answered", () => {
    expect(approvalEmailAction({}, t0 + 48 * hour)).toBeNull();
    expect(approvalEmailAction({ ...sent, [APPROVAL_KEY_YES]: T2 }, t0 + 48 * hour)).toBeNull();
    expect(approvalEmailAction({ ...sent, [APPROVAL_KEY_NO]: T2 }, t0 + 48 * hour)).toBeNull();
  });

  it("holds the reminder until 24 hours after the request email", () => {
    expect(approvalEmailAction(sent, t0 + 23 * hour)).toBeNull();
    expect(approvalEmailAction(sent, t0 + 24 * hour)).toBe("reminder");
    expect(approvalEmailAction(sent, t0 + 70 * hour)).toBe("reminder");
  });

  it("never sends a second reminder", () => {
    const done = { ...sent, [APPROVAL_KEY_REMINDER_SENT]: T3 };
    expect(approvalEmailAction(done, t0 + 24 * hour)).toBeNull();
    expect(approvalEmailAction(done, t0 + 500 * hour)).toBeNull();
  });

  it("retries a request email that failed, but only within the first day", () => {
    const failed = { [APPROVAL_KEY_REQUESTED]: T1 };
    expect(approvalEmailAction(failed, t0 + 60 * 1000)).toBeNull();
    expect(approvalEmailAction(failed, t0 + 10 * 60 * 1000)).toBe("request");
    expect(approvalEmailAction(failed, t0 + 25 * hour)).toBeNull();
  });
});
