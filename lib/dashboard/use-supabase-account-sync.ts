"use client";

import { useEffect, useRef } from "react";
import { syncLocalSessionWithSupabaseAccount } from "@/lib/onboarding/sync-registered-session";

type UseSupabaseAccountSyncOptions = {
  /** When set, re-check while the tab stays open (pending-approval screen). */
  intervalMs?: number;
};

/**
 * Keeps the local session aligned with the signed-in Supabase profile
 * (Explorer VPC activation, save-progress recognition).
 */
export function useSupabaseAccountSync(
  options: UseSupabaseAccountSyncOptions = {},
): void {
  const inFlightRef = useRef(false);
  const intervalMs = options.intervalMs;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (inFlightRef.current || cancelled) return;
      inFlightRef.current = true;
      try {
        await syncLocalSessionWithSupabaseAccount();
      } catch {
        // Local session stays as-is; the next pass can retry.
      } finally {
        inFlightRef.current = false;
      }
    }

    void run();

    const intervalId =
      typeof intervalMs === "number" && intervalMs > 0
        ? window.setInterval(() => {
            void run();
          }, intervalMs)
        : undefined;

    function onVisibility() {
      if (document.visibilityState === "visible") {
        void run();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);
}
