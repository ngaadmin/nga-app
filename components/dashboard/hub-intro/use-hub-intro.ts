"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useIntroRestoreGate } from "@/components/dashboard/hub-intro/use-intro-restore-gate";
import {
  hasSeenHubIntro,
  markHubIntroSeen,
} from "@/lib/dashboard/hub-intro/storage";
import type { HubIntroId } from "@/lib/dashboard/hub-intro/types";
import { currentAccountLocalKey } from "@/lib/onboarding/account-local-key";

export function useHubIntro(hubId: HubIntroId) {
  const { ready, sessionTick } = useIntroRestoreGate();
  const [hydrated, setHydrated] = useState(false);
  const [seen, setSeen] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"first" | "info">("info");
  const dismissedRef = useRef(false);

  useEffect(() => {
    const accountKey = currentAccountLocalKey();
    const alreadySeen = Boolean(accountKey) && hasSeenHubIntro(hubId);
    setSeen(alreadySeen);
    setHydrated(true);

    if (!accountKey || alreadySeen) {
      dismissedRef.current = alreadySeen;
      setOpen(false);
      return;
    }

    if (!ready) {
      setOpen(false);
      return;
    }

    setMode("first");
    // Wait a tick so the nav tap that opened this hub cannot hit the card
    // and mark it seen before the user reads it.
    const timeoutId = window.setTimeout(() => {
      if (dismissedRef.current || hasSeenHubIntro(hubId)) return;
      setOpen(true);
    }, 80);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hubId, ready, sessionTick]);

  const dismiss = useCallback(() => {
    dismissedRef.current = true;
    markHubIntroSeen(hubId);
    setSeen(true);
    setOpen(false);
  }, [hubId]);

  const closePanel = useCallback(() => {
    setOpen(false);
  }, []);

  const reopen = useCallback(() => {
    setMode("info");
    setOpen(true);
  }, []);

  return { hydrated, seen, open, mode, dismiss, closePanel, reopen };
}
