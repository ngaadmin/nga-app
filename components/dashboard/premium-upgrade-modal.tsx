"use client";

import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { unlockTestingPremium } from "@/lib/dashboard/testing-premium";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82]";

type PremiumUpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  body: string;
  titleId?: string;
  /** Called after the testing unlock is saved (e.g. open Advanced Money). */
  onUnlock?: () => void;
};

/** Shared Premium unlock popup used by Vault and Advanced Money. */
export function PremiumUpgradeModal({
  isOpen,
  onClose,
  title,
  body,
  titleId = "premium-upgrade-title",
  onUnlock,
}: PremiumUpgradeModalProps) {
  const copy = copyMatrix.dashboard.vault.budget;

  function handleUnlock() {
    unlockTestingPremium();
    onUnlock?.();
    onClose();
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      backdropClassName="bg-[#031F82]/45"
      panelClassName="max-w-sm rounded-nga-xl bg-white p-5"
    >
      <h2
        id={titleId}
        className="font-heading text-lg font-extrabold text-[#031F82]"
      >
        {title}
      </h2>
      <p className="mt-2 text-sm text-[#1E3A5F]">{body}</p>
      <button
        type="button"
        onClick={handleUnlock}
        className={cn("mt-4 h-touch w-full px-4", orangeCtaClass)}
      >
        {copy.premiumUnlock}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 w-full py-2 text-sm font-bold text-[#0CC1E0]"
      >
        {copy.premiumLater}
      </button>
    </ModalShell>
  );
}
