"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { zLayerStyle } from "@/lib/ui/layers";

type DeleteLearnerConfirmSheetProps = {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  error: string | null;
  isDeleting: boolean;
  pinLabel?: string;
  pinValue?: string;
  onPinChange?: (value: string) => void;
  confirmDisabled?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const SANS_FALLBACK =
  'ui-sans-serif, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif';

const headingFont = {
  fontFamily: `var(--font-poppins), ${SANS_FALLBACK}`,
} as const;

const bodyFont = {
  fontFamily: `var(--font-inter), ${SANS_FALLBACK}`,
} as const;

function BodyPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-7"
    >
      <path
        fill="#031F82"
        d="M9 3.5h6a1 1 0 0 1 1 1V6h3.25a.75.75 0 0 1 0 1.5h-.72l-.78 11.2A2.25 2.25 0 0 1 15.51 21H8.49a2.25 2.25 0 0 1-2.24-2.3L5.47 7.5H4.75a.75.75 0 0 1 0-1.5H8V4.5a1 1 0 0 1 1-1Zm1.5 2.5h3V5h-3v1Zm-3.2 1.5.74 10.55a.75.75 0 0 0 .75.7h6.42a.75.75 0 0 0 .75-.7L15.7 7.5H7.3Zm2.15 2.15a.75.75 0 0 1 .75.7l-.35 6.5a.75.75 0 0 1-1.5-.08l.35-6.5a.75.75 0 0 1 .75-.62Zm5.1 0a.75.75 0 0 1 .75.62l.35 6.5a.75.75 0 1 1-1.5.08l-.35-6.5a.75.75 0 0 1 .75-.7Z"
      />
    </svg>
  );
}

/**
 * Floating confirm card for deleting one learner.
 * Copy is passed in. The confirm label stays sentence case.
 */
export function DeleteLearnerConfirmSheet({
  isOpen,
  title,
  body,
  confirmLabel,
  cancelLabel,
  error,
  isDeleting,
  pinLabel,
  pinValue = "",
  onPinChange,
  confirmDisabled = false,
  onClose,
  onConfirm,
}: DeleteLearnerConfirmSheetProps) {
  if (!isOpen) return null;

  return (
    <BodyPortal>
      <div
        className="pointer-events-auto fixed inset-0"
        style={zLayerStyle("toast")}
      >
        <div
          className="absolute inset-0 animate-nga-scrim-fade bg-[#031F82]/45"
          onClick={isDeleting ? undefined : onClose}
        />
        <div
          role="alertdialog"
          aria-labelledby="account-delete-title"
          aria-describedby="account-delete-body"
          className="animate-nga-sheet-up absolute inset-x-4 rounded-[24px] bg-white p-6 text-center shadow-nga-delete-sheet"
          style={{ bottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#EAF0FF]">
            <TrashIcon />
          </div>
          <h2
            id="account-delete-title"
            style={headingFont}
            className="mt-4 text-[22px] font-bold leading-tight text-[#031F82]"
          >
            {title}
          </h2>
          <p
            id="account-delete-body"
            style={bodyFont}
            className="mt-2 text-[16px] leading-[1.5] text-[#4A5578]"
          >
            {body}
          </p>
          {pinLabel ? (
            <label className="mt-4 block text-left">
              <span
                style={headingFont}
                className="text-sm font-bold text-[#031F82]"
              >
                {pinLabel}
              </span>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoComplete="off"
                value={pinValue}
                disabled={isDeleting}
                onChange={(event) => {
                  onPinChange?.(event.target.value.replace(/\D/g, "").slice(0, 4));
                }}
                aria-label={pinLabel}
                className="mt-1.5 w-full rounded-xl border-2 border-[#BDE9FB] bg-[#F7FBFF] px-4 py-2.5 text-center text-lg font-bold tracking-[0.35em] text-[#031F82] outline-none focus:border-[#0CC1E0]"
                style={headingFont}
              />
            </label>
          ) : null}
          {error ? (
            <p
              style={bodyFont}
              className="mt-3 text-sm font-medium text-[#031F82]"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting || confirmDisabled}
              style={headingFont}
              className="inline-flex h-[52px] w-full items-center justify-center rounded-[16px] border-b-4 border-[#021558] bg-[#031F82] text-[16px] font-bold text-white transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0 disabled:active:border-b-4"
            >
              {confirmLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              style={headingFont}
              className="inline-flex h-12 w-full items-center justify-center bg-transparent text-[16px] font-semibold text-[#031F82] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </BodyPortal>
  );
}
