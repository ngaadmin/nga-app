"use client";

import { useEffect } from "react";
import {
  accountProgressLogFields,
  isEmptyAccountProgress,
  mergeAccountProgress,
  type AccountProgressPayload,
} from "@/lib/dashboard/account-progress";
import { ACCOUNT_PROGRESS_DIRTY_EVENT } from "@/lib/dashboard/account-progress-dirty";
import {
  collectAccountProgress,
  persistAccountProgressCacheFromLive,
  restoreAccountProgressForUser,
} from "@/lib/dashboard/account-progress-local";
import { readUserSession } from "@/lib/onboarding/guest-session";
import {
  loadLearnerProgressByUserId,
  saveLearnerProgressForUser,
} from "@/lib/onboarding/learner-progress";
import { createClient } from "@/lib/supabase/client";

const PUSH_DEBOUNCE_MS = 700;

let pushTimer: number | undefined;
let pushInFlight = false;
let restoreInFlight = false;

function registeredOwner(): {
  userId?: string;
  username?: string;
} | null {
  const session = readUserSession();
  if (session?.accessMode !== "registered") return null;
  if (!session.supabaseUserId && !session.username.trim()) return null;
  return {
    userId: session.supabaseUserId,
    username: session.username,
  };
}

/** Prefer the signed-in Auth uid; fall back to the local registered profile id. */
async function resolveChildAuthUserId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const authId = data.user?.id?.trim();
    if (authId) return authId;
  } catch {
    // Missing public keys or cookie — use the local registered session id.
  }

  const session = readUserSession();
  if (session?.accessMode !== "registered") return null;
  return session.supabaseUserId?.trim() || null;
}

function logProgressWrite(
  userId: string | null,
  payload: AccountProgressPayload | null,
): void {
  const fields = accountProgressLogFields(payload);
  console.info("[learner-progress:write]", {
    userId,
    xp: fields.xp,
    milestoneCount: fields.milestoneCount,
  });
}

async function pushAccountProgressNow(): Promise<void> {
  if (typeof window === "undefined" || pushInFlight) return;
  const owner = registeredOwner();
  if (!owner) return;

  const childId = await resolveChildAuthUserId();
  const local = collectAccountProgress();
  persistAccountProgressCacheFromLive({
    userId: childId ?? owner.userId,
    username: owner.username,
  });

  if (!childId) {
    logProgressWrite(null, local);
    return;
  }

  pushInFlight = true;
  try {
    const remote = await loadLearnerProgressByUserId(childId);
    if (
      isEmptyAccountProgress(local) &&
      remote &&
      !isEmptyAccountProgress(remote)
    ) {
      return;
    }

    const payload = mergeAccountProgress(remote, local) ?? local;
    if (isEmptyAccountProgress(payload)) return;
    await saveLearnerProgressForUser(childId, payload);
  } catch {
    // Next dirty event or dashboard sync can retry.
  } finally {
    pushInFlight = false;
  }
}

export function scheduleAccountProgressPush(): void {
  if (typeof window === "undefined") return;
  const owner = registeredOwner();
  if (!owner) return;

  persistAccountProgressCacheFromLive(owner);

  window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    void pushAccountProgressNow();
  }, PUSH_DEBOUNCE_MS);
}

/** Immediate cloud + cache write so logout cannot drop the only copy. */
export async function persistRegisteredProgressNow(): Promise<void> {
  if (typeof window === "undefined") return;
  const owner = registeredOwner();
  if (!owner) return;

  window.clearTimeout(pushTimer);
  const childId = await resolveChildAuthUserId();
  const local = collectAccountProgress();
  persistAccountProgressCacheFromLive({
    userId: childId ?? owner.userId,
    username: owner.username,
  });

  if (!childId) {
    logProgressWrite(null, local);
    return;
  }

  if (isEmptyAccountProgress(local)) return;

  const remote = await loadLearnerProgressByUserId(childId);
  const payload = mergeAccountProgress(remote, local) ?? local;
  await saveLearnerProgressForUser(childId, payload);
}

export async function restoreRegisteredAccountProgress(input?: {
  userId?: string | null;
  username?: string | null;
  remotePayload?: AccountProgressPayload | null;
}): Promise<void> {
  if (typeof window === "undefined" || restoreInFlight) return;

  const owner = input?.userId || input?.username ? input : registeredOwner();
  if (!owner) return;

  restoreInFlight = true;
  try {
    const childId = owner.userId?.trim() || (await resolveChildAuthUserId());
    const remote = childId
      ? await loadLearnerProgressByUserId(childId)
      : (input?.remotePayload ?? null);
    restoreAccountProgressForUser({
      userId: childId ?? owner.userId,
      username: owner.username,
      remote: remote ?? input?.remotePayload ?? null,
    });
    persistAccountProgressCacheFromLive({
      userId: childId ?? owner.userId,
      username: owner.username,
    });
    scheduleAccountProgressPush();
  } catch {
    restoreAccountProgressForUser({
      userId: owner.userId,
      username: owner.username,
      remote: input?.remotePayload ?? null,
    });
  } finally {
    restoreInFlight = false;
  }
}

export function useAccountProgressSync(): void {
  useEffect(() => {
    function onDirty() {
      scheduleAccountProgressPush();
    }

    window.addEventListener(ACCOUNT_PROGRESS_DIRTY_EVENT, onDirty);

    const owner = registeredOwner();
    if (owner) {
      void restoreRegisteredAccountProgress(owner);
    }

    return () => {
      window.removeEventListener(ACCOUNT_PROGRESS_DIRTY_EVENT, onDirty);
    };
  }, []);
}
