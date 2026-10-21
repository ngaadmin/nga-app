"use client";

import { useEffect } from "react";
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
  /** Leave the mobile bottom nav outside the backdrop. */
  clearBottomNav?: boolean;
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
  clearBottomNav = false,
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
      clearBottomNav={clearBottomNav}
      backdropClassName="bg-[#031F82]/45"
      panelClassName="relative mx-auto max-h-full w-full max-w-[480px] overflow-y-auto rounded-[20px] bg-white px-5 py-6 shadow-[0_24px_48px_-24px_rgba(3,31,130,0.45)] min-[721px]:p-7"
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Close"
        className="absolute right-[14px] top-[14px] flex size-11 items-center justify-center rounded-full text-[#031F82]/70 transition-colors hover:bg-[#BDE9FB]/50 hover:text-[#031F82] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#031F82]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          className="size-4"
          aria-hidden
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <h2
        id={titleId}
        className="pr-12 font-heading text-[20px] font-bold leading-tight text-[#031F82] min-[721px]:text-[22px]"
      >
        {title}
      </h2>
      <p
        id={bodyId}
        className="mt-[10px] font-sans text-[17px] font-normal leading-relaxed text-[#3a4570]"
      >
        {body}
      </p>
      {disclaimer ? (
        <p
          id={disclaimerId}
          className="mt-3 font-sans text-xs leading-relaxed text-[#3a4570]/70"
        >
          {disclaimer}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onDismiss}
        className="mt-6 inline-flex h-12 min-h-12 min-w-[160px] items-center justify-center rounded-[12px] bg-[#FFC93C] px-7 font-heading text-[16px] font-bold text-[#031F82] shadow-[0_2px_0_#d9a12a] transition-colors hover:bg-[#FFD66B] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#031F82]"
      >
        {cta}
      </button>
    </ModalShell>
  );
}
