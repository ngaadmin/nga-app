"use client";

import { useId, useRef } from "react";
import { ClientPortal } from "@/components/ui/client-portal";
import { LAYER_CLASS, LAYER_ROOT_IDS } from "@/lib/ui/layers";
import { useDialogFocusTrap } from "@/lib/ui/use-dialog-focus-trap";
import { cn } from "@/lib/utils/cn";

export type ConfirmDialogTone = "destructive" | "primary";

export type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  /** Shown on the confirm button while `busy` is true. */
  busyLabel?: string;
  confirmTone?: ConfirmDialogTone;
  /** Leave out for a one-button notice (the confirm button then closes it). */
  cancelLabel?: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  /** Cancel button, Escape and tapping outside. Never runs the confirm action. */
  onCancel: () => void;
  /** Lets screens and tests find a specific dialog. */
  testId?: string;
};

const confirmToneClass: Record<ConfirmDialogTone, string> = {
  destructive:
    "border-b-4 border-[#021558] bg-[#031F82] text-white hover:brightness-[1.02]",
  primary:
    "border-b-4 border-[#C88202] bg-[#FFA503] text-[#031F82] hover:brightness-[1.02]",
};

/**
 * The one shared confirm / notice dialog. Every screen passes its copy in;
 * there are no per-cohort versions.
 *
 * Accessibility: alertdialog with labelled title and body, focus trapped
 * inside, Escape = cancel, focus returns to the opener on close. With a
 * cancel button, focus starts on cancel so the safe choice is the default.
 */
export function ConfirmDialog({
  isOpen,
  title,
  body,
  confirmLabel,
  busyLabel,
  confirmTone = "primary",
  cancelLabel,
  busy = false,
  error,
  onConfirm,
  onCancel,
  testId,
}: ConfirmDialogProps) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const bodyId = `${baseId}-body`;
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const dismiss = () => {
    if (busy) return;
    onCancel();
  };

  useDialogFocusTrap(panelRef, isOpen, dismiss, cancelLabel ? cancelRef : confirmRef);

  if (!isOpen) return null;

  return (
    <ClientPortal rootId={LAYER_ROOT_IDS.modal}>
      <div
        className={cn(
          "pointer-events-auto fixed inset-0 flex items-center justify-center bg-[#031F82]/50 p-4",
          LAYER_CLASS.modal,
        )}
        onClick={dismiss}
        data-testid={testId ? `${testId}-backdrop` : undefined}
      >
        <div
          ref={panelRef}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
          tabIndex={-1}
          data-testid={testId}
          className="w-full max-w-sm rounded-[24px] bg-white p-6 text-center shadow-nga-pop outline-none"
          onClick={(event) => event.stopPropagation()}
        >
          <h2
            id={titleId}
            className="font-heading text-[22px] font-extrabold leading-tight text-[#031F82]"
          >
            {title}
          </h2>
          <p
            id={bodyId}
            className="mt-2 font-sans text-base leading-relaxed text-[#1E3A5F]"
          >
            {body}
          </p>
          {error ? (
            <p className="mt-3 font-sans text-sm font-medium text-[#031F82]" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3">
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              disabled={busy}
              aria-busy={busy || undefined}
              data-tone={confirmTone}
              className={cn(
                "inline-flex min-h-[52px] w-full items-center justify-center rounded-[16px] px-4 font-heading text-base font-bold transition-all active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40",
                confirmToneClass[confirmTone],
              )}
            >
              {busy && busyLabel ? busyLabel : confirmLabel}
            </button>
            {cancelLabel ? (
              <button
                ref={cancelRef}
                type="button"
                onClick={dismiss}
                disabled={busy}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-[16px] font-heading text-base font-semibold text-[#031F82] hover:bg-[#031F82]/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {cancelLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </ClientPortal>
  );
}
