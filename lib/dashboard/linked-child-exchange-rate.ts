"use server";

import "server-only";

import {
  ACCOUNT_PROGRESS_SCHEMA_VERSION,
  type AccountProgressPayload,
} from "@/lib/dashboard/account-progress";
import { WALLET_SCHEMA_VERSION, type PersistedDashboardWallet } from "@/lib/dashboard/dashboard-wallet-storage";
import { listLinkedChildrenForCurrentParent } from "@/lib/onboarding/list-linked-children";
import {
  readLearnerProgressRow,
  writeLearnerProgressRow,
} from "@/lib/onboarding/learner-progress-store";
import {
  MAX_EXCHANGE_RATE_CENTS,
  MIN_EXCHANGE_RATE_CENTS,
  resolveExchangeRateCents,
  withExchangeRate,
} from "@/lib/dashboard/xp-cash";

export type LinkedChildCashRate = {
  userId: string;
  username: string;
  centsPer100Xp: number | null;
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
    return { ok: false, error: "Enter an amount like 2, 3, or 0.50." };
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
