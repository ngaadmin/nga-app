import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

/** One card in the Parent Hub list. */
export type ParentHubChild = {
  userId: string;
  username: string;
  cohort: MasteryCohort | null;
  /** "waiting": the parent hasn't given consent yet. */
  status: "active" | "waiting";
  /** Lifetime lessons completed (survives a track change). 0 while waiting. */
  lessonsDone: number;
  /** Coins the child can still cash in. 0 while waiting. */
  coins: number;
  /** Waiting child with an open approval in "Needs your OK". */
  requestId?: string;
};

export type PendingApprovalRef = {
  requestId: string;
  childId: string;
  childUsername: string;
  childCohort: MasteryCohort | null;
};

/** Chip on a waiting child's card. Same words as the "Needs your OK" row. */
export const PENDING_CONSENT_CHIP = "Waiting for approval";

/**
 * Every child the parent should see: linked children plus children whose
 * consent request is still waiting for this parent (not linked until
 * approved). A waiting child carries no progress (lessons and coins are 0)
 * because the parent hasn't consented yet, and is matched to its open
 * approval so the card can open it. Active first, then by name.
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
    if (child.status !== "waiting") return { ...child };
    const request =
      byChildId.get(child.userId) ??
      byName.get(child.username.trim().toLowerCase());
    if (request) seen.add(request.childId);
    return {
      ...child,
      lessonsDone: 0,
      coins: 0,
      ...(request ? { requestId: request.requestId } : {}),
    };
  });

  const linkedNames = new Set(
    linked.map((child) => child.username.trim().toLowerCase()),
  );
  for (const request of pending) {
    if (seen.has(request.childId)) continue;
    if (linkedNames.has(request.childUsername.trim().toLowerCase())) continue;
    seen.add(request.childId);
    merged.push({
      userId: request.childId,
      username: request.childUsername.trim(),
      cohort: request.childCohort,
      status: "waiting",
      lessonsDone: 0,
      coins: 0,
      requestId: request.requestId,
    });
  }

  return merged.sort((a, b) =>
    a.status === b.status
      ? a.username.localeCompare(b.username)
      : a.status === "active"
        ? -1
        : 1,
  );
}
