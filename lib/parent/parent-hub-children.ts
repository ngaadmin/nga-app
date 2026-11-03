import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

/** A child the parent has approved: their progress shows on the card. */
export type ParentHubActiveChild = {
  userId: string;
  username: string;
  cohort: MasteryCohort | null;
  status: "active";
  /** Lifetime lessons completed (survives a track change). */
  lessonsDone: number;
  /** Coins the child can still cash in. */
  coins: number;
};

/**
 * A child still waiting for the parent's consent. Only who they are: no
 * lessons, coins or any other progress or usage field exists on this shape,
 * so none can reach the browser before the parent approves.
 */
export type ParentHubWaitingChild = {
  userId: string;
  username: string;
  cohort: MasteryCohort | null;
  status: "waiting";
  /** Open approval in "Needs your OK", when there is one. */
  requestId?: string;
};

/** One card in the Parent Hub list. */
export type ParentHubChild = ParentHubActiveChild | ParentHubWaitingChild;

/** Keys a waiting child may carry to the client. Anything else is a leak. */
export const WAITING_CHILD_KEYS = [
  "userId",
  "username",
  "cohort",
  "status",
  "requestId",
] as const;

export type PendingApprovalRef = {
  requestId: string;
  childId: string;
  childUsername: string;
  childCohort: MasteryCohort | null;
};

/** Chip on a waiting child's card. Same words as the "Needs your OK" row. */
export const PENDING_CONSENT_CHIP = "Waiting for approval";

function waitingChild(
  base: { userId: string; username: string; cohort: MasteryCohort | null },
  requestId?: string,
): ParentHubWaitingChild {
  // Built field by field so nothing extra from a source row is copied over.
  return {
    userId: base.userId,
    username: base.username,
    cohort: base.cohort,
    status: "waiting",
    ...(requestId ? { requestId } : {}),
  };
}

/**
 * Every child the parent should see: linked children plus children whose
 * consent request is still waiting for this parent (not linked until
 * approved). A waiting child carries identity only (id, name, track) and is
 * matched to its open approval so the card can open it. Active first, then
 * by name.
 */
export function mergeParentHubChildren(
  linked: readonly ParentHubChild[],
  pending: readonly PendingApprovalRef[],
): ParentHubChild[] {
  const byChildId = new Map<string, PendingApprovalRef>();
  const byName = new Map<string, PendingApprovalRef>();
  for (const request of pending) {
    if (request.childId) byChildId.set(request.childId, request);
    byName.set(request.childUsername.trim().toLowerCase(), request);
  }

  const seen = new Set<string>();
  const merged: ParentHubChild[] = linked.map((child) => {
    seen.add(child.userId);
    if (child.status === "active") return { ...child };
    const request =
      byChildId.get(child.userId) ??
      byName.get(child.username.trim().toLowerCase());
    if (request) seen.add(request.childId);
    return waitingChild(child, request?.requestId ?? child.requestId);
  });

  const linkedNames = new Set(
    linked.map((child) => child.username.trim().toLowerCase()),
  );
  for (const request of pending) {
    if (seen.has(request.childId)) continue;
    if (linkedNames.has(request.childUsername.trim().toLowerCase())) continue;
    seen.add(request.childId);
    merged.push(
      waitingChild(
        {
          userId: request.childId,
          username: request.childUsername.trim(),
          cohort: request.childCohort,
        },
        request.requestId,
      ),
    );
  }

  return merged.sort((a, b) =>
    a.status === b.status
      ? a.username.localeCompare(b.username)
      : a.status === "active"
        ? -1
        : 1,
  );
}
