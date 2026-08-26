"use client";

import { useCallback, useEffect, useState } from "react";
import {
  hasSeenHubIntro,
  markHubIntroSeen,
} from "@/lib/dashboard/hub-intro/storage";
import type { HubIntroId } from "@/lib/dashboard/hub-intro/types";

export function useHubIntro(hubId: HubIntroId) {
  const [hydrated, setHydrated] = useState(false);
  const [seen, setSeen] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"first" | "info">("info");

  useEffect(() => {
    const alreadySeen = hasSeenHubIntro(hubId);
    setSeen(alreadySeen);
    setHydrated(true);

    if (alreadySeen) {
      setOpen(false);
      return;
    }

    setMode("first");
    // Wait a tick so the nav tap that opened this hub cannot hit the card
    // and mark it seen before the user reads it.
    const timeoutId = window.setTimeout(() => {
      setOpen(true);
    }, 80);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hubId]);

  const dismiss = useCallback(() => {
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
