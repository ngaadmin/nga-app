"use client";

import { useEffect } from "react";
import {
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
  loadCurrentLearnerProgress,
  saveCurrentLearnerProgress,
} from "@/lib/onboarding/learner-progress";

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

async function pushAccountProgressNow(): Promise<void> {
  if (typeof window === "undefined" || pushInFlight) return;
  const owner = registeredOwner();
  if (!owner) return;

  const local = collectAccountProgress();
  persistAccountProgressCacheFromLive(owner);

  pushInFlight = true;
  try {
    const remote = await loadCurrentLearnerProgress();
    if (
      isEmptyAccountProgress(local) &&
      remote &&
      !isEmptyAccountProgress(remote)
    ) {
      return;
    }

    const payload = mergeAccountProgress(remote, local) ?? local;
    if (isEmptyAccountProgress(payload)) return;
    await saveCurrentLearnerProgress(payload);
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
    const remote =
      input?.remotePayload !== undefined
        ? input.remotePayload
        : await loadCurrentLearnerProgress();
    restoreAccountProgressForUser({
      userId: owner.userId,
      username: owner.username,
      remote: remote ?? null,
    });
    persistAccountProgressCacheFromLive(owner);
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
