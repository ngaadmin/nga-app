"use server";

import "server-only";

import { cookies } from "next/headers";
import {
  mergeParentHubChildren,
  type ParentHubChild,
} from "@/lib/parent/parent-hub-children";

import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { countOwedCashIns, sumOwedCashInCents } from "@/lib/dashboard/xp-cash";
import { readLearnerProgressPayloads } from "@/lib/onboarding/learner-progress-store";
import { listPendingConsentRequestsForParent } from "@/lib/onboarding/approve-consent-request";
import { isParentTabEligible } from "@/lib/parent/parent-tab-eligibility";
import {
  parentTabGatePassValid,
  signParentTabGatePass,
} from "@/lib/parent/parent-tab-gate-pass";
import { isParentTabPin, type ParentTabPinCheck } from "@/lib/parent/parent-tab-pin";
import {
  checkParentPinWithLockout,
  clearParentPinLockout,
  readParentPinLock,
} from "@/lib/parent/parent-pin-lockout";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { hashCredential } from "@/lib/auth/credential-hash";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/keys";
import { persistParentPin } from "@/lib/dashboard/persist-parent-pin";
import {
  PARENT_DATA_GRANT_COOKIE,
  PARENT_DATA_GRANT_TTL_MS,
  signParentDataGrant,
} from "@/lib/privacy/parent-data-grant";
import { assembleLearnerView } from "@/lib/privacy/data-controls";
import { createAdminClient } from "@/lib/supabase/admin";
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

/** Server-side source of truth for the Parent tab (Parent Hub). Reads only. */
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

  const linkedChildren = children.map((row) => ({
    accountRole: row.account_role,
    accountStatus: row.account_status,
  }));
  let eligible = isParentTabEligible({
    accountRole: profile.account_role,
    linkedChildren,
  });
  if (!eligible) {
    // Approvals live only in the Parent Hub, so a waiting request opens it.
    const pending = await listPendingConsentRequestsForParent();
    eligible = isParentTabEligible({
      accountRole: profile.account_role,
      linkedChildren,
      pendingApprovals: pending.ok ? pending.requests.length : 0,
    });
  }

  return {
    userId: user.id,
    parentName: String(profile.username ?? "").trim(),
    children,
    eligible,
  };
}

export type ParentTabAccess =
  | {
      eligible: true;
      parentUserId: string;
      parentName: string;
      /** Linked children, for "your child's" vs "your children's" copy. */
      childCount: number;
    }
  | { eligible: false };

export async function loadParentTabAccess(): Promise<ParentTabAccess> {
  try {
    const context = await resolveParentContext();
    if (!context?.eligible) return { eligible: false };
    return {
      eligible: true,
      parentUserId: context.userId,
      parentName: context.parentName,
      childCount: context.children.length,
    };
  } catch {
    return { eligible: false };
  }
}

const PIN_COPY = {
  notParent: "Only the parent account can use the Parent PIN.",
  missing: "Create your Parent PIN first.",
  wrong: "That PIN didn't match. Try again.",
  locked: "Too many wrong tries.",
  error: "Couldn't check your PIN. Try again.",
  exists: "A Parent PIN is already set. Enter it instead.",
  format: "Enter 4 numbers.",
} as const;


/**
 * Signed-in parent (any parent_master, linked child or not). Server-checked.
 * Also returns the one Parent PIN hash (profiles.parent_pin_hash).
 */
async function resolveSignedInParent(): Promise<{
  userId: string;
  email: string | null;
  parentPinHash: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("account_role, parent_pin_hash")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.account_role !== "parent_master") return null;
  const hash =
    typeof profile.parent_pin_hash === "string" ? profile.parent_pin_hash.trim() : "";
  return { userId: user.id, email: user.email ?? null, parentPinHash: hash };
}

/** A correct Parent PIN also opens account and child data for 15 minutes. */
async function grantParentData(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PARENT_DATA_GRANT_COOKIE, signParentDataGrant(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PARENT_DATA_GRANT_TTL_MS / 1000,
  });
}

/**
 * Whether this parent has a Parent PIN yet. There is one PIN: the Parent PIN
 * on profiles.parent_pin_hash. The old Parent Hub PIN table is not read.
 */
export async function getParentPinState(): Promise<
  | { ok: true; hasPin: boolean; lockedUntil: number | null }
  | { ok: false; error: string }
> {
  try {
    const parent = await resolveSignedInParent();
    if (!parent) return { ok: false, error: PIN_COPY.notParent };
    const lock = parent.parentPinHash
      ? await readParentPinLock(parent.userId)
      : { locked: false, lockedUntil: null };
    return {
      ok: true,
      hasPin: Boolean(parent.parentPinHash),
      lockedUntil: lock.locked ? lock.lockedUntil : null,
    };
  } catch {
    return { ok: false, error: PIN_COPY.error };
  }
}

/**
 * First-time Parent PIN. Only when none exists, so it can't overwrite a PIN a
 * parent already set. Returns an in-memory gate pass.
 */
export async function createParentPin(
  pin: string,
): Promise<{ ok: true; pass: string } | { ok: false; error: string }> {
  try {
    const parent = await resolveSignedInParent();
    if (!parent) return { ok: false, error: PIN_COPY.notParent };
    if (typeof pin !== "string" || !isParentTabPin(pin)) {
      return { ok: false, error: PIN_COPY.format };
    }
    if (parent.parentPinHash) return { ok: false, error: PIN_COPY.exists };
    const saved = await persistParentPin({ pin });
    if (!saved.ok) return { ok: false, error: saved.error };
    await grantParentData(parent.userId);
    return { ok: true, pass: signParentTabGatePass(parent.userId) };
  } catch {
    return { ok: false, error: PIN_COPY.error };
  }
}

const RESET_COPY = {
  password: "Enter your account password.",
  wrongPassword: "That password didn't match. Try again.",
  limited: "Too many password tries. Wait a few minutes, then try again.",
  error: "We could not reset your Parent PIN. Try again.",
} as const;

/** Signs in with a throwaway client (no cookies), so the parent's session is untouched. */
async function accountPasswordMatches(
  userId: string,
  email: string,
  password: string,
): Promise<boolean> {
  const client = createSupabaseJsClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  const matches = !error && data.user?.id === userId;
  if (data.session) await client.auth.signOut({ scope: "local" }).catch(() => undefined);
  return matches;
}

/**
 * Forgotten Parent PIN: the signed-in parent account re-enters its account
 * password and sets a new 4-digit PIN in one step. There is one Parent PIN,
 * so this replaces profiles.parent_pin_hash and clears the wrong-PIN lockout.
 * A child profile (or anyone not signed in as the parent) is refused.
 */
export async function resetParentPinWithPassword(
  password: string,
  newPin: string,
): Promise<{ ok: true; pass: string } | { ok: false; error: string }> {
  try {
    const parent = await resolveSignedInParent();
    if (!parent) return { ok: false, error: PIN_COPY.notParent };
    if (typeof newPin !== "string" || !isParentTabPin(newPin)) {
      return { ok: false, error: PIN_COPY.format };
    }
    if (typeof password !== "string" || !password) {
      return { ok: false, error: RESET_COPY.password };
    }
    if (!parent.email) return { ok: false, error: RESET_COPY.error };
    const limit = consumeRateLimit(`parent-pin-reset-password:${parent.userId}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) return { ok: false, error: RESET_COPY.limited };
    if (!(await accountPasswordMatches(parent.userId, parent.email, password))) {
      return { ok: false, error: RESET_COPY.wrongPassword };
    }
    const { error } = await createAdminClient()
      .from("profiles")
      .update({
        parent_pin_hash: hashCredential(newPin),
        parent_pin_reset_hash: null,
        parent_pin_reset_expires_at: null,
      })
      .eq("id", parent.userId)
      .eq("account_role", "parent_master");
    if (error) return { ok: false, error: RESET_COPY.error };
    await clearParentPinLockout(parent.userId);
    await grantParentData(parent.userId);
    return { ok: true, pass: signParentTabGatePass(parent.userId) };
  } catch {
    return { ok: false, error: RESET_COPY.error };
  }
}

/**
 * Checks the Parent PIN (profiles.parent_pin_hash) on the server. Wrong tries
 * count in public.parent_pin_lockouts (5 misses, then a 5-minute lock), shared
 * with every other Parent PIN check. A match signs the short-lived
 * gate pass (kept in memory by the client) and opens the data views.
 * Used by the Parent Hub, the cash rate and every approval.
 */
export async function openParentTabGate(
  pin: string,
): Promise<ParentTabPinCheck> {
  const fail = (
    reason: "missing" | "wrong" | "locked" | "error",
    error: string,
    lockedUntil: number | null = null,
  ): ParentTabPinCheck => ({ ok: false, reason, error, triesLeft: 0, lockedUntil });
  try {
    const parent = await resolveSignedInParent();
    if (!parent) return fail("error", PIN_COPY.notParent);
    if (!parent.parentPinHash) return fail("missing", PIN_COPY.missing);

    const checked = await checkParentPinWithLockout({
      parentId: parent.userId,
      pin,
      storedHash: parent.parentPinHash,
      copy: PIN_COPY,
    });
    if (!checked.ok) {
      return {
        ok: false,
        reason: checked.reason === "format" ? "wrong" : checked.reason,
        error: checked.error,
        triesLeft: checked.triesLeft,
        lockedUntil: checked.lockedUntil,
      };
    }
    await grantParentData(parent.userId);
    return { ok: true, pass: signParentTabGatePass(parent.userId) };
  } catch {
    return fail("error", PIN_COPY.error);
  }
}

/**
 * Keeps an open Parent Hub open: a still-valid pass gets a fresh pass and a
 * fresh data grant, so nothing inside the Hub asks for the PIN again. Only
 * works before the current pass expires; leaving or backgrounding the Hub
 * drops the pass and the entry gate asks again.
 */
export async function renewParentTabGatePass(
  pass: string,
): Promise<{ ok: true; pass: string } | { ok: false }> {
  try {
    const parent = await resolveSignedInParent();
    if (!parent || !parentTabGatePassValid(pass, parent.userId)) {
      return { ok: false };
    }
    await grantParentData(parent.userId);
    return { ok: true, pass: signParentTabGatePass(parent.userId) };
  } catch {
    return { ok: false };
  }
}

export type ParentTabChildSummary = ParentHubChild;

/**
 * Distinct lessons each child has ever finished, from usage_events
 * (lesson_completed). The academy map resets on a track change, so the
 * card uses whichever is higher: this count or the current map's count.
 */
async function readLifetimeLessonCounts(
  usernames: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const admin = createAdminClient();
  await Promise.all(
    usernames.map(async (username) => {
      const safe = username.trim().replace(/[\\%_]/g, (char) => `\\${char}`);
      if (!safe) return;
      const { data, error } = await admin
        .from("usage_events")
        .select("lesson_number")
        .eq("event_type", "lesson_completed")
        .ilike("username", safe)
        .not("lesson_number", "is", null)
        .limit(5000);
      if (error || !data) return;
      const distinct = new Set(
        data
          .map((row) => Number(row.lesson_number))
          .filter((value) => Number.isInteger(value) && value > 0),
      );
      counts.set(username.toLowerCase(), distinct.size);
    }),
  );
  return counts;
}

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
      /** Cash-ins that make up owedCents. */
      cashIns: number;
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
      error: "Only a parent with a linked child can open the Parent Hub.",
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
  // Progress is read for active children only: a waiting child's parent
  // hasn't consented, so none of their data reaches the Hub.
  const active = shown.filter((row) => row.account_status === "active");
  const [payloads, lifetimeLessons, pending] = await Promise.all([
    readLearnerProgressPayloads(active.map((row) => row.id)),
    readLifetimeLessonCounts(active.map((row) => String(row.username).trim())),
    listPendingConsentRequestsForParent(),
  ]);

  const linked: ParentTabChildSummary[] = shown.map((row) => {
    const username = String(row.username).trim();
    if (row.account_status !== "active") {
      // Identity only: no progress, usage or wallet field for a waiting child.
      return {
        userId: row.id,
        username,
        cohort: asCohort(row.curriculum_cohort),
        status: "waiting" as const,
      };
    }
    const progress = payloads.get(row.id) ?? {};
    const view = assembleLearnerView({
      userId: row.id,
      username,
      trackLabel: null,
      progress,
      activity: [],
      leaderboardEnabled: false,
    });
    return {
      userId: row.id,
      username: view.username,
      cohort: asCohort(row.curriculum_cohort),
      status: "active" as const,
      lessonsDone: Math.max(
        view.lessonsDone,
        lifetimeLessons.get(view.username.toLowerCase()) ?? 0,
      ),
      coins: view.coins,
    };
  });
  const pendingRequests = pending.ok ? pending.requests : [];
  const children = mergeParentHubChildren(linked, pendingRequests);

  const needsOk: ParentTabOkItem[] = [];
  for (const request of pendingRequests) {
    needsOk.push({
      kind: "approval",
      requestId: request.requestId,
      childUsername: request.childUsername,
      childCohort: request.childCohort,
      expiresAt: request.expiresAt,
    });
  }
  for (const row of active) {
    const progress = payloads.get(row.id) as { wallet?: unknown } | undefined;
    const wallet = (progress?.wallet ?? null) as Parameters<
      typeof sumOwedCashInCents
    >[0];
    const owedCents = sumOwedCashInCents(wallet);
    if (owedCents > 0) {
      needsOk.push({
        kind: "owed",
        childUserId: row.id,
        childUsername: String(row.username).trim(),
        owedCents,
        cashIns: countOwedCashIns(wallet),
      });
    }
  }

  return {
    ok: true,
    data: { parentName: context.parentName, children, needsOk, messages: [] },
  };
}

