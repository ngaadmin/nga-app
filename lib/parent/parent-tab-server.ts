"use server";

import "server-only";

import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { countOwedCashIns, sumOwedCashInCents } from "@/lib/dashboard/xp-cash";
import { readLearnerProgressPayloads } from "@/lib/onboarding/learner-progress-store";
import { listPendingConsentRequestsForParent } from "@/lib/onboarding/approve-consent-request";
import { isParentTabEligible } from "@/lib/parent/parent-tab-eligibility";
import {
  parentTabGatePassValid,
  signParentTabGatePass,
} from "@/lib/parent/parent-tab-gate-pass";
import {
  PARENT_TAB_PIN_MAX_TRIES,
  isParentTabPin,
  nextParentTabPinCounters,
  parentTabPinLockActive,
  type ParentTabPinCheck,
} from "@/lib/parent/parent-tab-pin";
import {
  hashParentTabPin,
  newParentTabPinHash,
  parentTabPinHashesMatch,
} from "@/lib/parent/parent-tab-pin-hash";
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

type ParentPinRow = {
  pin_hash: string;
  pin_salt: string;
  pin_iterations: number;
  failed_tries: number;
  locked_until: string | null;
};

const PIN_COPY = {
  notParent: "Only the parent account can use the parent PIN.",
  missing: "Create your parent PIN first.",
  wrong: "That PIN didn't match.",
  locked: "Too many wrong tries.",
  error: "Couldn't check your PIN. Try again.",
  exists: "A parent PIN is already set. Enter it instead.",
  format: "Enter 4 numbers.",
} as const;

/** Signed-in parent (any parent_master, linked child or not). Server-checked. */
async function resolveSignedInParent(): Promise<{
  userId: string;
  email: string | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("account_role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.account_role !== "parent_master") return null;
  return { userId: user.id, email: user.email ?? null };
}

async function readPinRow(parentId: string): Promise<ParentPinRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("parent_tab_pins")
    .select("pin_hash, pin_salt, pin_iterations, failed_tries, locked_until")
    .eq("parent_id", parentId)
    .maybeSingle();
  if (error) throw new Error("parent_tab_pins read failed");
  return (data as ParentPinRow | null) ?? null;
}

function lockedUntilMs(row: ParentPinRow): number | null {
  if (!row.locked_until) return null;
  const ms = Date.parse(row.locked_until);
  return Number.isFinite(ms) ? ms : null;
}

/** Whether this parent has a PIN yet, and any lock still running. */
export async function getParentPinState(): Promise<
  | { ok: true; hasPin: boolean; lockedUntil: number | null }
  | { ok: false; error: string }
> {
  try {
    const parent = await resolveSignedInParent();
    if (!parent) return { ok: false, error: PIN_COPY.notParent };
    const row = await readPinRow(parent.userId);
    if (!row) return { ok: true, hasPin: false, lockedUntil: null };
    const until = lockedUntilMs(row);
    return {
      ok: true,
      hasPin: true,
      lockedUntil: until && until > Date.now() ? until : null,
    };
  } catch {
    return { ok: false, error: PIN_COPY.error };
  }
}

/**
 * First-time PIN. Only when none exists, so it can't overwrite a PIN a
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
    const hashed = await newParentTabPinHash(pin);
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("parent_tab_pins")
      .upsert(
        {
          parent_id: parent.userId,
          pin_hash: hashed.hash,
          pin_salt: hashed.salt,
          pin_iterations: hashed.iterations,
          failed_tries: 0,
          locked_until: null,
        },
        { onConflict: "parent_id", ignoreDuplicates: true },
      )
      .select("parent_id");
    if (error) return { ok: false, error: PIN_COPY.error };
    if (!data || data.length === 0) return { ok: false, error: PIN_COPY.exists };
    return { ok: true, pass: signParentTabGatePass(parent.userId) };
  } catch {
    return { ok: false, error: PIN_COPY.error };
  }
}

/**
 * Checks the parent PIN on the server (PBKDF2 with the stored salt and
 * iterations, constant-time compare). Counts misses in the table: 5 misses
 * lock it for 5 minutes. Only a match signs the short-lived gate pass, which
 * the client keeps in memory. Used by the Parent tab and every approval.
 */
export async function openParentTabGate(
  pin: string,
): Promise<ParentTabPinCheck> {
  const fail = (
    reason: "missing" | "wrong" | "locked" | "error",
    error: string,
    triesLeft = 0,
    lockedUntil: number | null = null,
  ): ParentTabPinCheck => ({ ok: false, reason, error, triesLeft, lockedUntil });
  try {
    const parent = await resolveSignedInParent();
    if (!parent) return fail("error", PIN_COPY.notParent);
    const row = await readPinRow(parent.userId);
    if (!row) return fail("missing", PIN_COPY.missing);

    const now = Date.now();
    const counters = {
      failedTries: Number(row.failed_tries) || 0,
      lockedUntil: lockedUntilMs(row),
    };
    if (parentTabPinLockActive(counters, now)) {
      return fail("locked", PIN_COPY.locked, 0, counters.lockedUntil);
    }

    const matched =
      typeof pin === "string" &&
      isParentTabPin(pin) &&
      parentTabPinHashesMatch(
        await hashParentTabPin(pin, row.pin_salt, row.pin_iterations),
        row.pin_hash,
      );
    const next = nextParentTabPinCounters(counters, matched, now);

    const admin = createAdminClient();
    let update = admin
      .from("parent_tab_pins")
      .update({
        failed_tries: next.failedTries,
        locked_until: next.lockedUntil
          ? new Date(next.lockedUntil).toISOString()
          : null,
      })
      .eq("parent_id", parent.userId)
      .eq("failed_tries", row.failed_tries);
    update = row.locked_until
      ? update.eq("locked_until", row.locked_until)
      : update.is("locked_until", null);
    const { data: saved, error } = await update.select("parent_id");
    if (error) return fail("error", PIN_COPY.error);
    if (!saved || saved.length === 0) {
      // Another check landed first. Don't sign a pass on a stale read.
      return fail("error", PIN_COPY.error);
    }

    if (matched) {
      return { ok: true, pass: signParentTabGatePass(parent.userId) };
    }
    if (next.lockedUntil) {
      return fail("locked", PIN_COPY.locked, 0, next.lockedUntil);
    }
    return fail(
      "wrong",
      PIN_COPY.wrong,
      PARENT_TAB_PIN_MAX_TRIES - next.failedTries,
    );
  } catch {
    return fail("error", PIN_COPY.error);
  }
}

export type ParentTabChildSummary = {
  userId: string;
  username: string;
  cohort: MasteryCohort | null;
  status: "active" | "waiting";
  /** Lifetime lessons completed (survives a track change). */
  lessonsDone: number;
  /**
   * Coins the child can still cash in: learner_progress.payload.wallet
   * .totalPoints, the same number as the child's header and Vault. Cashing
   * in lowers it; lifetime earned coins are not shown here.
   */
  coins: number;
};

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
  const [payloads, lifetimeLessons] = await Promise.all([
    readLearnerProgressPayloads(shown.map((row) => row.id)),
    readLifetimeLessonCounts(shown.map((row) => String(row.username).trim())),
  ]);

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
        lessonsDone: Math.max(
          view.lessonsDone,
          lifetimeLessons.get(view.username.toLowerCase()) ?? 0,
        ),
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

/**
 * "Forgot your PIN?": the parent re-confirms their account password, then
 * the server deletes their PIN row (and any lockout) so they can pick a new
 * one. Uses a throwaway client so the current
 * session cookies are never touched.
 */
export async function confirmParentPasswordForPinReset(
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const parent = await resolveSignedInParent();
  if (!user?.email || !parent || parent.userId !== user.id) {
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
  const admin = createAdminClient();
  const { error: deleteError } = await admin
    .from("parent_tab_pins")
    .delete()
    .eq("parent_id", user.id);
  if (deleteError) {
    return { ok: false, error: "Couldn't reset your PIN. Try again." };
  }
  return { ok: true };
}
