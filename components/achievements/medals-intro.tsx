"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageIntroCard } from "@/components/dashboard/hub-intro/page-intro-card";
import { useIntroRestoreGate } from "@/components/dashboard/hub-intro/use-intro-restore-gate";
import { medalsIntroCopy } from "@/lib/dashboard/medals-intro-copy";
import {
  hasAccountSeenMedalsIntro,
  markAccountMedalsIntroSeen,
} from "@/lib/dashboard/page-intro-seen";

export function MedalsIntro() {
  const { ready, sessionTick } = useIntroRestoreGate();
  const [seen, setSeen] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"first" | "info">("info");
  const dismissedRef = useRef(false);

  useEffect(() => {
    const alreadySeen = hasAccountSeenMedalsIntro();
    setSeen(alreadySeen);

    if (alreadySeen) {
      dismissedRef.current = true;
      setOpen(false);
      return;
    }

    if (!ready) {
      setOpen(false);
      return;
    }

    setMode("first");
    const timeoutId = window.setTimeout(() => {
      if (dismissedRef.current || hasAccountSeenMedalsIntro()) return;
      setOpen(true);
    }, 80);
    return () => window.clearTimeout(timeoutId);
  }, [ready, sessionTick]);

  const dismiss = useCallback(() => {
    dismissedRef.current = true;
    markAccountMedalsIntroSeen();
    setSeen(true);
    setOpen(false);
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
  }, []);

  const reopen = useCallback(() => {
    setMode("info");
    setOpen(true);
  }, []);

  const isFirst = mode === "first";

  return (
    <>
      {seen ? (
        <button
          type="button"
          onClick={reopen}
          aria-label={medalsIntroCopy.infoButtonAriaLabel}
          className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#0CC1E0] font-heading text-xs font-extrabold text-[#031F82] transition-colors hover:bg-[#F0FBFF]"
        >
          i
        </button>
      ) : null}
      {open ? (
        <PageIntroCard
          idPrefix="medals-intro"
          layer="toast"
          title={medalsIntroCopy.title}
          body={medalsIntroCopy.body}
          cta={isFirst ? medalsIntroCopy.firstVisitCta : medalsIntroCopy.infoCta}
          dismissOnBackdrop={!isFirst}
          closeOnEscape={!isFirst}
          escapeCapture={!isFirst}
          onDismiss={isFirst ? dismiss : closePanel}
        />
      ) : null}
    </>
  );
}
