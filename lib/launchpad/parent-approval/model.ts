import {
  APPROVAL_KEY_NO,
  APPROVAL_KEY_REQUESTED,
  APPROVAL_KEY_YES,
} from "@/lib/launchpad/parent-approval/config";

/** none: not asked yet. pending: asked, no answer. approved / declined: parent answered. */
export type ParentApprovalStatus = "none" | "pending" | "approved" | "declined";

export type ParentApprovalMilestones = Record<string, unknown> | null | undefined;

function stamp(map: ParentApprovalMilestones, key: string): number | null {
  const raw = map && typeof map === "object" ? (map as Record<string, unknown>)[key] : null;
  if (typeof raw !== "string") return null;
  const time = Date.parse(raw);
  return Number.isNaN(time) ? null : time;
}

/**
 * Status from the milestone map. The latest parent answer wins, so a parent
 * can change a "not now" to a yes. A yes can't be undone from the learner side.
 */
export function parentApprovalStatus(map: ParentApprovalMilestones): ParentApprovalStatus {
  const requested = stamp(map, APPROVAL_KEY_REQUESTED);
  const yes = stamp(map, APPROVAL_KEY_YES);
  const no = stamp(map, APPROVAL_KEY_NO);
  if (yes !== null && (no === null || yes >= no)) return "approved";
  if (no !== null) return "declined";
  if (requested !== null) return "pending";
  return "none";
}

/** Date the request was sent, or null. */
export function parentApprovalRequestedAt(map: ParentApprovalMilestones): string | null {
  const raw = map && typeof map === "object" ? (map as Record<string, unknown>)[APPROVAL_KEY_REQUESTED] : null;
  return typeof raw === "string" && !Number.isNaN(Date.parse(raw)) ? raw : null;
}

/** Map after the learner reaches the stop. Does not overwrite an earlier request. */
export function withApprovalRequested(map: ParentApprovalMilestones, nowIso: string): Record<string, unknown> {
  const base = { ...(map && typeof map === "object" ? map : {}) } as Record<string, unknown>;
  if (stamp(map, APPROVAL_KEY_REQUESTED) === null) base[APPROVAL_KEY_REQUESTED] = nowIso;
  return base;
}

/** Map after the parent answers. */
export function withApprovalDecision(
  map: ParentApprovalMilestones,
  decision: "yes" | "no",
  nowIso: string,
): Record<string, unknown> {
  const base = withApprovalRequested(map, nowIso);
  base[decision === "yes" ? APPROVAL_KEY_YES : APPROVAL_KEY_NO] = nowIso;
  return base;
}

/** True when the venture id is a plain blueprint id. */
export function isVentureId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,63}$/.test(value);
}

/** What the learner's screen needs. */
export type LearnerApprovalGateView = {
  /** False for guests, non-learners, and learners with no linked parent. */
  applies: boolean;
  status: ParentApprovalStatus;
};

export const NO_APPROVAL_GATE: LearnerApprovalGateView = { applies: false, status: "none" };

/**
 * The gate for a signed-in active learner. The stop is a hard stop, so a learner
 * with no linked parent does NOT skip it: they see the waiting screen (fail
 * closed) and nothing is written, because there is no parent to receive a request.
 * `needsRequest` is true only when a linked parent should be sent the request now.
 */
export function learnerApprovalGate(
  hasLinkedParent: boolean,
  map: ParentApprovalMilestones,
): { view: LearnerApprovalGateView; needsRequest: boolean } {
  if (!hasLinkedParent) return { view: { applies: true, status: "pending" }, needsRequest: false };
  const status = parentApprovalStatus(map);
  return { view: { applies: true, status }, needsRequest: status === "none" };
}
