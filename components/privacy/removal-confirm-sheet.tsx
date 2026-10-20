"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { TrashIcon } from "@/lib/dashboard/icons";
import { zLayerStyle } from "@/lib/ui/layers";

export type RemovalItem = {
  emoji: string;
  title: string;
  detail: string;
};

type RemovalConfirmSheetProps = {
  open: boolean;
  title: string;
  body: string;
  items: RemovalItem[];
  footnote?: string;
  confirmLabel: string;
  confirmDisabled?: boolean;
  phraseLabel?: string;
  phraseValue?: string;
  onPhraseChange?: (value: string) => void;
  pinLabel?: string;
  pinValue?: string;
  onPinChange?: (value: string) => void;
  error?: string | null;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

function BodyPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

/** Confirm sheet. Red is only the final button. */
export function RemovalConfirmSheet({
  open,
  title,
  body,
  items,
  footnote,
  confirmLabel,
  confirmDisabled = false,
  phraseLabel,
  phraseValue = "",
  onPhraseChange,
  pinLabel,
  pinValue = "",
  onPinChange,
  error,
  busy = false,
  onConfirm,
  onClose,
}: RemovalConfirmSheetProps) {
  if (!open) return null;

  return (
    <BodyPortal>
      <div className="pointer-events-auto fixed inset-0" style={zLayerStyle("toast")}>
        <div
          className="absolute inset-0 bg-[#031F82]/45"
          onClick={busy ? undefined : onClose}
        />
        <div
          role="alertdialog"
          aria-labelledby="data-removal-title"
          aria-describedby="data-removal-body"
          className="absolute inset-x-4 max-h-[calc(100%-32px)] overflow-y-auto rounded-[24px] bg-white p-6 shadow-[0_-8px_32px_rgba(3,31,130,0.18)]"
          style={{ bottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#EAF0FF] text-[#031F82]">
            <TrashIcon className="size-7" />
          </div>
          <h2
            id="data-removal-title"
            className="mt-4 text-center font-heading text-[22px] font-extrabold leading-tight text-[#031F82]"
          >
            {title}
          </h2>
          <p
            id="data-removal-body"
            className="mt-2 text-center font-sans text-[16px] leading-relaxed text-[#1E3A5F]"
          >
            {body}
          </p>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.title} className="flex items-center gap-3 text-left">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EAF0FF] text-lg">
                  {item.emoji}
                </span>
                <span className="min-w-0">
                  <span className="block font-heading text-[15px] font-extrabold text-[#031F82]">
                    {item.title}
                  </span>
                  <span className="block font-sans text-[13px] font-medium text-[#4A5675]">
                    {item.detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {footnote ? (
            <p className="mt-4 text-center font-sans text-[13px] leading-snug text-[#4A5675]">
              {footnote}
            </p>
          ) : null}
          {pinLabel ? (
            <label className="mt-4 block text-left">
              <span className="font-heading text-sm font-extrabold text-[#031F82]">{pinLabel}</span>
              <input
                value={pinValue}
                onChange={(event) =>
                  onPinChange?.(event.target.value.replace(/\D/g, "").slice(0, 4))
                }
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                aria-label={pinLabel}
                className="mt-2 h-12 w-full rounded-2xl border-2 border-[#BDE9FB] px-3 font-heading text-base font-extrabold tracking-[0.3em] text-[#031F82] outline-none"
              />
            </label>
          ) : null}
          {phraseLabel ? (
            <label className="mt-4 block text-left">
              <span className="font-heading text-sm font-extrabold text-[#031F82]">
                {phraseLabel}
              </span>
              <input
                value={phraseValue}
                onChange={(event) => onPhraseChange?.(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                aria-label={phraseLabel}
                className="mt-2 h-12 w-full rounded-2xl border-2 border-[#0CC1E0] px-3 font-heading text-base font-extrabold tracking-wide text-[#031F82] outline-none"
              />
            </label>
          ) : null}
          {error ? (
            <p role="alert" className="mt-3 text-center font-sans text-sm text-[#031F82]">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled || busy}
            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-2xl border-b-4 border-[#8E1B1B] bg-[#C62828] px-3 font-heading text-base font-bold text-white transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="mt-3 w-full py-2 text-center font-heading text-base font-semibold text-[#031F82]"
          >
            Cancel
          </button>
        </div>
      </div>
    </BodyPortal>
  );
}
