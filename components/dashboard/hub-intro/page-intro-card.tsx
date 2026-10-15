"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { STATUS_BANNER_INSET_CLASS } from "@/components/dashboard/status-banner-layout";
import { ModalShell } from "@/components/ui/modal-shell";

type PageIntroCardProps = {
  idPrefix: string;
  title: string;
  body: string;
  cta: string;
  disclaimer?: string;
  dismissOnBackdrop: boolean;
  closeOnEscape: boolean;
  /** Capture Escape so a panel behind this card stays open. */
  escapeCapture?: boolean;
  /**
   * Medals (and any intro opened on top of a modal-layer panel) use the toast
   * layer so the card stays above that panel. Both layers are centralized.
   */
  layer?: "modal" | "toast";
  onDismiss: () => void;
};

export function PageIntroCard({
  idPrefix,
  title,
  body,
  cta,
  disclaimer,
  dismissOnBackdrop,
  closeOnEscape,
  escapeCapture = false,
  layer = "modal",
  onDismiss,
}: PageIntroCardProps) {
  const titleId = `${idPrefix}-title`;
  const bodyId = `${idPrefix}-body`;
  const disclaimerId = disclaimer ? `${idPrefix}-disclaimer` : undefined;

  useEffect(() => {
    if (!closeOnEscape) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (escapeCapture) event.stopImmediatePropagation();
      onDismiss();
    }

    window.addEventListener("keydown", onKeyDown, escapeCapture);
    return () => window.removeEventListener("keydown", onKeyDown, escapeCapture);
  }, [closeOnEscape, escapeCapture, onDismiss]);

  return (
    <ModalShell
      isOpen
      layer={layer}
      onClose={dismissOnBackdrop ? onDismiss : undefined}
      dismissOnBackdrop={dismissOnBackdrop}
      align="center"
      stretch
      labelledBy={titleId}
      describedBy={disclaimerId ? `${bodyId} ${disclaimerId}` : bodyId}
      backdropClassName={cn("bg-[#031F82]/45", STATUS_BANNER_INSET_CLASS)}
      panelClassName="rounded-nga-xl bg-white p-5 shadow-nga-card"
    >
      <h2
        id={titleId}
        className="font-heading text-xl font-extrabold leading-tight text-[#031F82]"
      >
        {title}
      </h2>
      <p
        id={bodyId}
        className="mt-3 font-sans text-sm leading-relaxed text-[#1E3A5F]"
      >
        {body}
      </p>
      {disclaimer ? (
        <p
          id={disclaimerId}
          className="mt-3 font-sans text-xs leading-relaxed text-[#1E3A5F]/70"
        >
          {disclaimer}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onDismiss}
        className="mt-5 inline-flex h-touch min-h-touch w-full items-center justify-center rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-6 font-heading text-sm font-bold text-[#031F82] shadow-sm transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2"
      >
        {cta}
      </button>
    </ModalShell>
  );
}
