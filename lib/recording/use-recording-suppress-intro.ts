"use client";

// TODO: remove after recordings
import { useEffect, useState } from "react";
import { USER_SESSION_UPDATED_EVENT } from "@/lib/onboarding/user-session-events";
import { resolveRecordingSuppressIntro } from "@/lib/recording/resolve-recording-suppress-intro";

const CLOSED = { ready: false, suppress: false };

/**
 * Stays closed until the recording check finishes so a listed account
 * never sees the intro flash open.
 */
export function useRecordingSuppressIntro(): { ready: boolean; suppress: boolean } {
  const [state, setState] = useState(CLOSED);

  useEffect(() => {
    let generation = 0;

    const apply = () => {
      const current = ++generation;
      void resolveRecordingSuppressIntro().then((suppress) => {
        if (current !== generation) return;
        setState({ ready: true, suppress });
      });
    };

    apply();
    window.addEventListener(USER_SESSION_UPDATED_EVENT, apply);
    return () => {
      generation += 1;
      window.removeEventListener(USER_SESSION_UPDATED_EVENT, apply);
    };
  }, []);

  return state;
}
