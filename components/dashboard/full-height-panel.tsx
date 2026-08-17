"use client";

import { useEffect, type ReactNode } from "react";
import { ClientPortal } from "@/components/ui/client-portal";
import { LAYER_CLASS, LAYER_ROOT_IDS } from "@/lib/ui/layers";
import { cn } from "@/lib/utils/cn";

type FullHeightPanelProps = {
  isOpen: boolean;
  title: string;
  titleId: string;
  onClose: () => void;
  children: ReactNode;
};

/** Full-viewport collection panel (Skills, Streaks). Uses the modal layer. */
export function FullHeightPanel({
  isOpen,
  title,
  titleId,
  onClose,
  children,
}: FullHeightPanelProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <ClientPortal rootId={LAYER_ROOT_IDS.modal}>
      <div
        className={cn(
          "pointer-events-auto fixed inset-0 flex flex-col bg-white",
          LAYER_CLASS.modal,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-nga-mist px-4 py-3">
          <h2
            id={titleId}
            className="min-w-0 flex-1 font-heading text-lg font-extrabold text-[#031F82]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#031F82]/70 transition-colors hover:bg-[#BDE9FB]/50 hover:text-[#031F82]"
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
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-8">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
      </div>
    </ClientPortal>
  );
}
