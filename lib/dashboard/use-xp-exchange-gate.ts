"use client";

import { useEffect, useState } from "react";
import { readUserSession } from "@/lib/onboarding/guest-session";
import { USER_SESSION_UPDATED_EVENT } from "@/lib/onboarding/user-session-events";
import { loadSignedInClassAccountCashIn } from "@/lib/school/class-account-status";

export type XpExchangeGate = {
  /** False until the session, and any class-seat check, has been read. */
  ready: boolean;
  /** Class seats and student seats have no XP exchange. */
  blocked: boolean;
};

/**
 * Guests and household accounts can open cash-in.
 * Class seats and student seats cannot.
 */
export function useXpExchangeGate(): XpExchangeGate {
  const [gate, setGate] = useState<XpExchangeGate>({ ready: false, blocked: false });

  useEffect(() => {
    let generation = 0;
    let cancelled = false;

    async function sync() {
      const current = ++generation;
      const session = readUserSession();
      if (!session || session.accessMode !== "registered") {
        if (!cancelled && current === generation) {
          setGate({ ready: true, blocked: false });
        }
        return;
      }
      try {
        const state = await loadSignedInClassAccountCashIn();
        if (!cancelled && current === generation) {
          setGate({ ready: true, blocked: state.classOrStudentSeat });
        }
      } catch {
        if (!cancelled && current === generation) {
          setGate({ ready: true, blocked: false });
        }
      }
    }

    void sync();
    const onSession = () => {
      void sync();
    };
    window.addEventListener(USER_SESSION_UPDATED_EVENT, onSession);
    return () => {
      cancelled = true;
      window.removeEventListener(USER_SESSION_UPDATED_EVENT, onSession);
    };
  }, []);

  return gate;
}
