"use server";

import "server-only";

import {
  ACCOUNT_PROGRESS_SCHEMA_VERSION,
  type AccountProgressPayload,
} from "@/lib/dashboard/account-progress";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { WALLET_SCHEMA_VERSION, type PersistedDashboardWallet } from "@/lib/dashboard/dashboard-wallet-storage";
import { listLinkedChildrenForCurrentParent } from "@/lib/onboarding/list-linked-children";
import {
  readLearnerProgressRow,
  writeLearnerProgressRow,
} from "@/lib/onboarding/learner-progress-store";
import {
  EXCHANGE_RATE_LIMIT_ERROR,
  MAX_EXCHANGE_RATE_CENTS,
  MIN_EXCHANGE_RATE_CENTS,
  resolveExchangeRateCents,
  sumOwedCashInCents,
  withCashInPaidReset,
  withExchangeRate,
} from "@/lib/dashboard/xp-cash";

export type LinkedChildCashRate = {
  userId: string;
  username: string;
  centsPer100Xp: number | null;
  /** Whole cents the grown-up still owes this child since the last reset. */
  owedCents: number;
};

function isAllowedRateCents(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= MIN_EXCHANGE_RATE_CENTS &&
    value <= MAX_EXCHANGE_RATE_CENTS
  );
}

function emptyChildWallet(ownerUserId: string): PersistedDashboardWallet {
  return {
    schemaVersion: WALLET_SCHEMA_VERSION,
    ownerUserId,
    totalPoints: 0,
    lifetimePointsEarned: 0,
    audSliderIndex: 2,
    xpExchangeRateSet: false,
  };
}

async function linkedChildren() {
  return listLinkedChildrenForCurrentParent();
}

/** Rates saved on each linked child's progress. The parent session cannot use its own wallet. */
export async function loadLinkedChildrenCashRates(): Promise<
  | { ok: true; children: LinkedChildCashRate[] }
  | { ok: false; error: string }
> {
  const linked = await linkedChildren();
  if (!linked.ok) return linked;

  const children = await Promise.all(
    linked.children.map(async (child) => {
      const progress = await readLearnerProgressRow(child.userId);
      return {
        userId: child.userId,
        username: child.username,
        centsPer100Xp: resolveExchangeRateCents(progress?.wallet),
        owedCents: sumOwedCashInCents(progress?.wallet),
      };
    }),
  );
  return { ok: true, children };
}

/**
 * Save one cent rate onto a linked child's learner_progress wallet.
 * Pass no childId to update every linked child. Does not change their XP.
 */
export async function saveLinkedChildExchangeRate(input: {
  centsPer100Xp: number;
  childId?: string | null;
}): Promise<{ ok: true; usernames: string[] } | { ok: false; error: string }> {
  if (!isAllowedRateCents(input.centsPer100Xp)) {
    return { ok: false, error: EXCHANGE_RATE_LIMIT_ERROR };
  }

  const linked = await linkedChildren();
  if (!linked.ok) return linked;
  const requested = input.childId?.trim() ?? "";
  const targets = requested
    ? linked.children.filter((child) => child.userId === requested)
    : linked.children;
  if (targets.length === 0) {
    return {
      ok: false,
      error: "Add your kid under Accounts, then set the rate here.",
    };
  }

  const at = new Date().toISOString();
  const writes = await Promise.all(
    targets.map(async (child) => {
      const existing = await readLearnerProgressRow(child.userId);
      const base = existing?.wallet ?? emptyChildWallet(child.userId);
      const wallet = withExchangeRate(base, input.centsPer100Xp, at);
      const payload: AccountProgressPayload = existing
        ? { ...existing, wallet }
        : {
            schemaVersion: ACCOUNT_PROGRESS_SCHEMA_VERSION,
            academyProgress: null,
            wallet,
            skillProgress: null,
            vaultProfile: null,
            vaultSession: null,
          };
      const wrote = await writeLearnerProgressRow(child.userId, payload);
      return wrote.ok ? child.username : null;
    }),
  );
  if (writes.some((username) => username == null)) {
    return { ok: false, error: "Could not save that rate. Try again." };
  }

  return { ok: true, usernames: writes.filter((username): username is string => Boolean(username)) };
}

/**
 * Mark one linked child's cashed-in XP as paid.
 * Sets a reset time on that child's progress. Their XP balance stays the same.
 */
export async function markLinkedChildCashInPaid(input: {
  childId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const childId = input.childId.trim();
  if (!childId) return { ok: false, error: "Pick which kid first." };

  const linked = await linkedChildren();
  if (!linked.ok) return linked;
  const child = linked.children.find((entry) => entry.userId === childId);
  if (!child) {
    return { ok: false, error: "Add your kid under Accounts, then set the rate here." };
  }

  const existing = await readLearnerProgressRow(child.userId);
  const base = existing?.wallet ?? emptyChildWallet(child.userId);
  const wallet = withCashInPaidReset(base, new Date().toISOString());
  const payload: AccountProgressPayload = existing
    ? { ...existing, wallet }
    : {
        schemaVersion: ACCOUNT_PROGRESS_SCHEMA_VERSION,
        academyProgress: null,
        wallet,
        skillProgress: null,
        vaultProfile: null,
        vaultSession: null,
      };
  const wrote = await writeLearnerProgressRow(child.userId, payload);
  if (!wrote.ok) return { ok: false, error: "Could not mark that as paid. Try again." };
  return { ok: true };
}

const SELF_RATE_BLOCKED = "Your account manager sets this rate.";

/**
 * A 16+ learner with no parent and no class seat saves a rate on their own wallet.
 * The signed-in user is the only profile this can write.
 */
export async function saveOwnExchangeRate(input: {
  centsPer100Xp: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isAllowedRateCents(input.centsPer100Xp)) {
    return { ok: false, error: EXCHANGE_RATE_LIMIT_ERROR };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, error: "Sign in to set your coins cash rate." };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, account_role, parent_approval_required, teacher_id, is_teacher")
    .eq("id", userId)
    .maybeSingle();
  if (
    !profile ||
    profile.account_role !== "child" ||
    profile.is_teacher === true ||
    profile.teacher_id ||
    profile.parent_approval_required !== false
  ) {
    return { ok: false, error: SELF_RATE_BLOCKED };
  }

  const { data: link } = await admin
    .from("parent_child")
    .select("parent_id")
    .eq("child_id", userId)
    .limit(1)
    .maybeSingle();
  if (link?.parent_id) return { ok: false, error: SELF_RATE_BLOCKED };

  const at = new Date().toISOString();
  const existing = await readLearnerProgressRow(userId);
  const base = existing?.wallet ?? emptyChildWallet(userId);
  const wallet = withExchangeRate(base, input.centsPer100Xp, at);
  const payload: AccountProgressPayload = existing
    ? { ...existing, wallet }
    : {
        schemaVersion: ACCOUNT_PROGRESS_SCHEMA_VERSION,
        academyProgress: null,
        wallet,
        skillProgress: null,
        vaultProfile: null,
        vaultSession: null,
      };
  const wrote = await writeLearnerProgressRow(userId, payload);
  if (!wrote.ok) return { ok: false, error: "Could not save that rate. Try again." };
  return { ok: true };
}
