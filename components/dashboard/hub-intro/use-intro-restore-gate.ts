"use client";

import { useEffect, useState } from "react";
import {
  ACCOUNT_PROGRESS_RESTORED_EVENT,
  isAccountProgressRestoreSettled,
} from "@/lib/dashboard/account-progress-dirty";
import { readUserSession } from "@/lib/onboarding/guest-session";
import { USER_SESSION_UPDATED_EVENT } from "@/lib/onboarding/user-session-events";

const RESTORE_WAIT_MS = 2000;

/**
 * Signed-in intros wait until cloud progress has been merged so a dismissal
 * from another device is not shown again. Guests decide from local storage.
 */
export function useIntroRestoreGate() {
  const [ready, setReady] = useState(false);
  const [sessionTick, setSessionTick] = useState(0);

  useEffect(() => {
    function onRestored() {
      setReady(true);
      setSessionTick((tick) => tick + 1);
    }
    function onSession() {
      setSessionTick((tick) => tick + 1);
    }
    window.addEventListener(ACCOUNT_PROGRESS_RESTORED_EVENT, onRestored);
    window.addEventListener(USER_SESSION_UPDATED_EVENT, onSession);
    return () => {
      window.removeEventListener(ACCOUNT_PROGRESS_RESTORED_EVENT, onRestored);
      window.removeEventListener(USER_SESSION_UPDATED_EVENT, onSession);
    };
  }, []);

  useEffect(() => {
    if (ready || isAccountProgressRestoreSettled()) {
      if (!ready) setReady(true);
      return;
    }

    const session = readUserSession();
    if (!session || session.accessMode !== "registered") {
      setReady(true);
      return;
    }

    const timeoutId = window.setTimeout(() => setReady(true), RESTORE_WAIT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [ready, sessionTick]);

  return { ready, sessionTick };
}
