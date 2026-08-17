"use client";

import { CashInPointsPanel } from "@/components/dashboard/points/cash-in-points-panel";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";

type XpExchangeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/** Academy XP icon popup: always opens the exchange UI. Confirm stays gated if no rate. */
export function XpExchangeModal({ isOpen, onClose }: XpExchangeModalProps) {
  const conversionCopy = copyMatrix.dashboard.settings.conversion;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      layer="toast"
      labelledBy="xp-exchange-title"
      backdropClassName="bg-[#031F82]/50"
      panelClassName="rounded-2xl border-0 bg-white p-5 shadow-md sm:p-6"
    >
      <div className="flex items-start gap-3">
        <h2
          id="xp-exchange-title"
          className="min-w-0 flex-1 font-heading text-xl font-extrabold leading-tight text-[#031F82]"
        >
          {conversionCopy.cashInHeading}
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
      </div>
      <div className="mt-3">
        <CashInPointsPanel hideHeading />
      </div>
    </ModalShell>
  );
}
