"use client";

import { ClientPortal } from "@/components/ui/client-portal";
import { LAYER_ROOT_IDS } from "@/lib/ui/layers";

type DeleteLearnerConfirmSheetProps = {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  error: string | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-7"
    >
      <path
        fill="#E5484D"
        d="M9 3.5h6a1 1 0 0 1 1 1V6h3.25a.75.75 0 0 1 0 1.5h-.72l-.78 11.2A2.25 2.25 0 0 1 15.51 21H8.49a2.25 2.25 0 0 1-2.24-2.3L5.47 7.5H4.75a.75.75 0 0 1 0-1.5H8V4.5a1 1 0 0 1 1-1Zm1.5 2.5h3V5h-3v1Zm-3.2 1.5.74 10.55a.75.75 0 0 0 .75.7h6.42a.75.75 0 0 0 .75-.7L15.7 7.5H7.3Zm2.15 2.15a.75.75 0 0 1 .75.7l-.35 6.5a.75.75 0 0 1-1.5-.08l.35-6.5a.75.75 0 0 1 .75-.62Zm5.1 0a.75.75 0 0 1 .75.62l.35 6.5a.75.75 0 1 1-1.5.08l-.35-6.5a.75.75 0 0 1 .75-.7Z"
      />
    </svg>
  );
}

/**
 * Mobile confirm sheet for deleting one learner.
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
  onClose,
  onConfirm,
}: DeleteLearnerConfirmSheetProps) {
  if (!isOpen) return null;

  return (
    <ClientPortal rootId={LAYER_ROOT_IDS.modal}>
      <div className="pointer-events-auto fixed inset-0">
        <div
          className="absolute inset-0 animate-nga-scrim-fade bg-[#031F82]/45"
          onClick={isDeleting ? undefined : onClose}
        />
        <div
          role="alertdialog"
          aria-labelledby="account-delete-title"
          aria-describedby="account-delete-body"
          className="animate-nga-sheet-up absolute inset-x-4 bottom-0 rounded-t-[24px] bg-white p-6 text-center shadow-nga-delete-sheet"
        >
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#FFE8E8]">
            <TrashIcon />
          </div>
          <h2
            id="account-delete-title"
            className="mt-4 font-heading text-[22px] font-bold leading-tight text-[#031F82]"
          >
            {title}
          </h2>
          <p
            id="account-delete-body"
            className="mt-2 font-sans text-[16px] leading-[1.5] text-[#4A5578]"
          >
            {body}
          </p>
          {error ? (
            <p className="mt-3 font-sans text-sm font-medium text-[#E5484D]" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="inline-flex h-[52px] w-full items-center justify-center rounded-[16px] border-b-4 border-[#B8303A] bg-[#E5484D] font-heading text-[16px] font-bold text-white transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0 disabled:active:border-b-4"
            >
              {confirmLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="inline-flex h-12 w-full items-center justify-center bg-transparent font-heading text-[16px] font-semibold text-[#031F82] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </ClientPortal>
  );
}
