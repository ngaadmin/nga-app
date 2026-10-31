"use server";

import "server-only";

import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { sumOwedCashInCents } from "@/lib/dashboard/xp-cash";
import { readLearnerProgressPayloads } from "@/lib/onboarding/learner-progress-store";
import { listPendingConsentRequestsForParent } from "@/lib/onboarding/approve-consent-request";
import { isParentTabEligible } from "@/lib/parent/parent-tab-eligibility";
import {
  parentTabGatePassValid,
  signParentTabGatePass,
} from "@/lib/parent/parent-tab-gate-pass";
import { assembleLearnerView } from "@/lib/privacy/data-controls";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/keys";
import { createClient } from "@/lib/supabase/server";

type ChildProfileRow = {
  id: string;
  username: string | null;
  account_role: string | null;
  account_status: string | null;
  curriculum_cohort: string | null;
};

type ParentContext = {
  userId: string;
  parentName: string;
  children: ChildProfileRow[];
  eligible: boolean;
};

function asCohort(value: string | null): MasteryCohort | null {
  return value === "explorer" || value === "pathfinder" || value === "maverick"
    ? value
    : null;
}

/** Server-side source of truth for the Parent tab. Reads only. */
async function resolveParentContext(): Promise<ParentContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, username, account_role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.account_role !== "parent_master") {
    return {
      userId: user.id,
      parentName: "",
      children: [],
      eligible: false,
    };
  }

  const { data: links } = await admin
    .from("parent_child")
    .select("child_id")
    .eq("parent_id", user.id);
  const childIds = [
    ...new Set((links ?? []).map((row) => row.child_id).filter(Boolean)),
  ] as string[];
  const { data: childRows } = childIds.length
    ? await admin
        .from("profiles")
        .select("id, username, account_role, account_status, curriculum_cohort")
        .in("id", childIds)
    : { data: [] as ChildProfileRow[] };
  const children = ((childRows ?? []) as ChildProfileRow[]).filter(
    (row) => row.account_role === "child" && Boolean(row.username?.trim()),
  );

  return {
    userId: user.id,
    parentName: String(profile.username ?? "").trim(),
    children,
    eligible: isParentTabEligible({
      accountRole: profile.account_role,
      linkedChildren: children.map((row) => ({
        accountRole: row.account_role,
        accountStatus: row.account_status,
      })),
    }),
  };
}

export type ParentTabAccess =
  | { eligible: true; parentUserId: string; parentName: string }
  | { eligible: false };

export async function loadParentTabAccess(): Promise<ParentTabAccess> {
  try {
    const context = await resolveParentContext();
    if (!context?.eligible) return { eligible: false };
    return {
      eligible: true,
      parentUserId: context.userId,
      parentName: context.parentName,
    };
  } catch {
    return { eligible: false };
  }
}

/**
 * Called right after the PIN is checked on this device. Returns a pass the
 * tab keeps in memory only. Test-only limit: the PIN hash lives on the
 * device, so the server can confirm the parent session but not the PIN
 * itself. The drafted migration moves the hash server-side so this action
 * can verify the PIN too.
 */
export async function openParentTabGate(): Promise<
  { ok: true; pass: string } | { ok: false; error: string }
> {
  const context = await resolveParentContext();
  if (!context?.eligible) {
    return {
      ok: false,
      error: "Only a parent with a linked child can open this.",
    };
  }
  return { ok: true, pass: signParentTabGatePass(context.userId) };
}

export type ParentTabChildSummary = {
  userId: string;
  username: string;
  cohort: MasteryCohort | null;
  status: "active" | "waiting";
  lessonsDone: number;
  dayStreak: number;
  coins: number;
};

export type ParentTabOkItem =
  | {
      kind: "approval";
      requestId: string;
      childUsername: string;
      childCohort: MasteryCohort | null;
      expiresAt: string;
    }
  | {
      kind: "owed";
      childUserId: string;
      childUsername: string;
      owedCents: number;
    };

export type ParentTabData = {
  parentName: string;
  children: ParentTabChildSummary[];
  needsOk: ParentTabOkItem[];
  /** No messages table exists yet, so this is always empty for now. */
  messages: never[];
};

export async function loadParentTabData(
  pass: string,
): Promise<
  | { ok: true; data: ParentTabData }
  | { ok: false; error: string; locked?: true }
> {
  const context = await resolveParentContext();
  if (!context?.eligible) {
    return {
      ok: false,
      error: "Only a parent with a linked child can open this.",
    };
  }
  if (!parentTabGatePassValid(pass, context.userId)) {
    return { ok: false, error: "Enter your parent PIN first.", locked: true };
  }

  const shown = context.children.filter(
    (row) =>
      row.account_status === "active" ||
      row.account_status === "pending_consent",
  );
  const payloads = await readLearnerProgressPayloads(
    shown.map((row) => row.id),
  );

  const children: ParentTabChildSummary[] = shown
    .map((row) => {
      const progress = payloads.get(row.id) ?? {};
      const view = assembleLearnerView({
        userId: row.id,
        username: String(row.username).trim(),
        trackLabel: null,
        progress,
        activity: [],
        leaderboardEnabled: false,
      });
      return {
        userId: row.id,
        username: view.username,
        cohort: asCohort(row.curriculum_cohort),
        status:
          row.account_status === "active"
            ? ("active" as const)
            : ("waiting" as const),
        lessonsDone: view.lessonsDone,
        dayStreak: view.dayStreak,
        coins: view.coins,
      };
    })
    .sort((a, b) =>
      a.status === b.status
        ? a.username.localeCompare(b.username)
        : a.status === "active"
          ? -1
          : 1,
    );

  const needsOk: ParentTabOkItem[] = [];
  const pending = await listPendingConsentRequestsForParent();
  if (pending.ok) {
    for (const request of pending.requests) {
      needsOk.push({
        kind: "approval",
        requestId: request.requestId,
        childUsername: request.childUsername,
        childCohort: request.childCohort,
        expiresAt: request.expiresAt,
      });
    }
  }
  for (const row of shown) {
    if (row.account_status !== "active") continue;
    const progress = payloads.get(row.id) as { wallet?: unknown } | undefined;
    const owedCents = sumOwedCashInCents(
      (progress?.wallet ?? null) as Parameters<typeof sumOwedCashInCents>[0],
    );
    if (owedCents > 0) {
      needsOk.push({
        kind: "owed",
        childUserId: row.id,
        childUsername: String(row.username).trim(),
        owedCents,
      });
    }
  }

  return {
    ok: true,
    data: { parentName: context.parentName, children, needsOk, messages: [] },
  };
}

/**
 * "Forgot your PIN?": the parent re-confirms their account password before
 * the device PIN can be cleared. Uses a throwaway client so the current
 * session cookies are never touched.
 */
export async function confirmParentPasswordForPinReset(
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const context = await resolveParentContext();
  if (!user?.email || !context?.eligible || context.userId !== user.id) {
    return { ok: false, error: "Only the parent account can reset this PIN." };
  }
  if (typeof password !== "string" || password.length === 0) {
    return { ok: false, error: "Enter your account password." };
  }
  const probe = createSupabaseJsClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await probe.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (error || data.user?.id !== user.id) {
    return { ok: false, error: "That password didn't match. Try again." };
  }
  await probe.auth.signOut({ scope: "local" }).catch(() => undefined);
  return { ok: true };
}
