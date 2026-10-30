import { resolveInactivityNotice } from "@/lib/privacy/notice-email";

/** 334 days: 11 months counted from 1 January in a non-leap year. */
export const INACTIVITY_WARN_AFTER_MS = 334 * 24 * 60 * 60 * 1000;

/** 365 days. Approved and other accounts. Not the pending-approval clock. */
export const INACTIVITY_DELETE_AFTER_MS = 365 * 24 * 60 * 60 * 1000;

/** Minimum time between the warning email and deletion. */
export const INACTIVITY_WARNING_LEAD_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Learner accounts still waiting for a parent to approve them.
 * 30 days from account creation. Sign-ins do not extend it.
 * The 24-hour approval link expiry is a separate clock.
 */
export const PENDING_UNAPPROVED_DELETE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

export type AccountRole = "child" | "parent_master" | "teacher";

export type ActivityAccount = {
  id: string;
  username: string;
  role: AccountRole;
  createdAt: string;
  lastSignInAt: string | null;
  lastUsageAt: string | null;
  warningSentAt: string | null;
  parentId: string | null;
  teacherId: string | null;
  authEmail: string | null;
  parentEmail: string | null;
  teacherEmail: string | null;
  guardianEmail: string | null;
  /**
   * Missing until the retention job can see approval state.
   * Only `pending_consent` with no approval date is the 30-day clock.
   */
  accountStatus?: "pending_consent" | "declined" | "active" | null;
  consentApprovedAt?: string | null;
};

export type InactivityWarningAudience =
  | "parent-self"
  | "parent-child"
  | "teacher-self"
  | "teacher-seat";

export type InactivityDecision =
  | { kind: "reset"; id: string }
  | {
      kind: "warn";
      id: string;
      email: string;
      audience: InactivityWarningAudience;
      username: string;
    }
  | {
      kind: "delete";
      id: string;
      role: AccountRole;
      username: string;
      parentId: string | null;
      teacherId: string | null;
    };

function parsedTime(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

/** Latest of account creation, sign-in, and usage. Null when creation is missing. */
export function ownLastActiveMs(account: ActivityAccount): number | null {
  const created = parsedTime(account.createdAt);
  if (created === null) return null;
  const extras = [parsedTime(account.lastSignInAt), parsedTime(account.lastUsageAt)].filter(
    (time): time is number => time !== null,
  );
  return Math.max(created, ...extras);
}

function relatedAccounts(
  account: ActivityAccount,
  accounts: readonly ActivityAccount[],
): ActivityAccount[] {
  if (account.role === "parent_master") {
    return accounts.filter((row) => row.parentId === account.id && row.id !== account.id);
  }
  if (account.role === "teacher") {
    return accounts.filter((row) => row.teacherId === account.id && row.id !== account.id);
  }
  return [];
}

/**
 * Parents stay active while any linked child is active.
 * Teachers stay active while any class seat is active.
 */
export function effectiveLastActiveMs(
  account: ActivityAccount,
  accounts: readonly ActivityAccount[],
): number | null {
  const own = ownLastActiveMs(account);
  if (own === null) return null;
  const related = relatedAccounts(account, accounts)
    .map((row) => ownLastActiveMs(row))
    .filter((time): time is number => time !== null);
  return Math.max(own, ...related);
}

function warningAudience(
  account: ActivityAccount,
  noticeAudience: "parent" | "teacher",
): InactivityWarningAudience {
  if (account.role === "parent_master") return "parent-self";
  if (account.role === "teacher") return "teacher-self";
  return noticeAudience === "teacher" ? "teacher-seat" : "parent-child";
}

/**
 * A child account that was never approved by a parent.
 * Teachers, class seats, and approved accounts are not on this clock.
 */
export function isUnapprovedLearnerAccount(account: ActivityAccount): boolean {
  if (account.role !== "child") return false;
  if (account.teacherId) return false;
  if (account.accountStatus !== "pending_consent" && account.accountStatus !== "declined") {
    return false;
  }
  if (account.consentApprovedAt) return false;
  return true;
}

/**
 * How one never-approved learner account is deleted: through the parent link
 * when there is one, otherwise on its own. Shared by the 30-day job and by a
 * parent's confirmed decline, so both use the same deletion steps.
 * Returns null for any account that is not an unapproved learner.
 */
export function planUnapprovedAccountDeletion(
  account: ActivityAccount,
): Extract<PlannedDeletion, { kind: "linked-child" | "standalone" }> | null {
  if (!isUnapprovedLearnerAccount(account)) return null;
  if (account.parentId) {
    return {
      kind: "linked-child",
      parentId: account.parentId,
      childId: account.id,
    };
  }
  return {
    kind: "standalone",
    userId: account.id,
    username: account.username.trim(),
  };
}

/**
 * Delete never-approved learner accounts 30 days after they were created.
 */
export function selectUnapprovedAccountDeletions(
  accounts: readonly ActivityAccount[],
  now: Date,
): PlannedDeletion[] {
  const nowMs = now.getTime();
  const planned: PlannedDeletion[] = [];
  for (const account of accounts) {
    if (!isUnapprovedLearnerAccount(account)) continue;
    const created = parsedTime(account.createdAt);
    if (created === null || nowMs - created < PENDING_UNAPPROVED_DELETE_AFTER_MS) {
      continue;
    }
    const item = planUnapprovedAccountDeletion(account);
    if (item) planned.push(item);
  }
  return planned.sort((left, right) =>
    unapprovedDeletionId(left).localeCompare(unapprovedDeletionId(right)),
  );
}

function unapprovedDeletionId(item: PlannedDeletion): string {
  switch (item.kind) {
    case "standalone":
      return item.userId;
    case "linked-child":
      return item.childId;
    case "household":
      return item.parentId;
    case "teacher":
      return item.teacherId;
    case "class-seat":
      return `${item.teacherId}:${item.username}`;
    default: {
      const _exhaustive: never = item;
      return JSON.stringify(_exhaustive);
    }
  }
}

/**
 * Warn at about 11 months, delete at 12 months.
 * A warning is sent once per quiet period and cleared when the account
 * (or, for a parent or teacher, someone in their household or class) is active again.
 * Deletion waits at least 30 days after that email, unless there is nobody we can email.
 * Never-approved learner accounts are left to the 30-day clock above.
 */
export function selectInactivityActions(
  accounts: readonly ActivityAccount[],
  now: Date,
): InactivityDecision[] {
  const nowMs = now.getTime();
  const decisions: InactivityDecision[] = [];

  for (const account of accounts) {
    if (isUnapprovedLearnerAccount(account)) continue;
    const lastActive = effectiveLastActiveMs(account, accounts);
    if (lastActive === null) continue;

    const warningSent = parsedTime(account.warningSentAt);
    if (warningSent !== null && lastActive > warningSent) {
      decisions.push({ kind: "reset", id: account.id });
      continue;
    }

    const inactiveFor = nowMs - lastActive;
    const notice = resolveInactivityNotice(account);
    const warningInForce = warningSent !== null && warningSent >= lastActive;
    const warningAged =
      warningInForce &&
      warningSent !== null &&
      nowMs - warningSent >= INACTIVITY_WARNING_LEAD_MS;

    if (inactiveFor >= INACTIVITY_DELETE_AFTER_MS && (warningAged || !notice)) {
      decisions.push({
        kind: "delete",
        id: account.id,
        role: account.role,
        username: account.username,
        parentId: account.parentId,
        teacherId: account.teacherId,
      });
      continue;
    }

    if (inactiveFor >= INACTIVITY_WARN_AFTER_MS && notice && !warningInForce) {
      decisions.push({
        kind: "warn",
        id: account.id,
        email: notice.email,
        audience: warningAudience(account, notice.audience),
        username: account.username.trim(),
      });
    }
  }

  return decisions.sort((left, right) => {
    if (left.kind !== right.kind) {
      const order = { reset: 0, warn: 1, delete: 2 };
      return order[left.kind] - order[right.kind];
    }
    return left.id.localeCompare(right.id);
  });
}

export type PlannedDeletion =
  | { kind: "household"; parentId: string }
  | { kind: "teacher"; teacherId: string }
  | { kind: "linked-child"; parentId: string; childId: string }
  | { kind: "class-seat"; teacherId: string; username: string }
  | { kind: "standalone"; userId: string; username: string };

/**
 * One call per account that should actually be removed.
 * A parent deletion already removes linked children.
 * A teacher deletion already removes class seats.
 */
export function planInactivityDeletions(
  decisions: readonly InactivityDecision[],
): PlannedDeletion[] {
  const deletes = decisions.filter(
    (decision): decision is Extract<InactivityDecision, { kind: "delete" }> =>
      decision.kind === "delete",
  );
  const parentIds = new Set(
    deletes.filter((decision) => decision.role === "parent_master").map((decision) => decision.id),
  );
  const teacherIds = new Set(
    deletes.filter((decision) => decision.role === "teacher").map((decision) => decision.id),
  );

  const planned: PlannedDeletion[] = [];
  for (const decision of deletes) {
    if (decision.role === "parent_master") {
      planned.push({ kind: "household", parentId: decision.id });
      continue;
    }
    if (decision.role === "teacher") {
      planned.push({ kind: "teacher", teacherId: decision.id });
      continue;
    }
    if (decision.parentId && parentIds.has(decision.parentId)) continue;
    if (decision.teacherId && teacherIds.has(decision.teacherId)) continue;
    if (decision.parentId) {
      planned.push({
        kind: "linked-child",
        parentId: decision.parentId,
        childId: decision.id,
      });
      continue;
    }
    if (decision.teacherId) {
      const username = decision.username.trim();
      if (!username) continue;
      planned.push({
        kind: "class-seat",
        teacherId: decision.teacherId,
        username,
      });
      continue;
    }
    planned.push({
      kind: "standalone",
      userId: decision.id,
      username: decision.username.trim(),
    });
  }

  return planned;
}
