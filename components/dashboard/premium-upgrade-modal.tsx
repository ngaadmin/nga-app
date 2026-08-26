"use client";

import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82]";

type PremiumUpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  titleId?: string;
  layer?: "modal" | "toast";
};

/** Shared Premium locked-feature popup (tester copy: dismiss only). */
export function PremiumUpgradeModal({
  isOpen,
  onClose,
  titleId = "premium-upgrade-title",
  layer = "modal",
}: PremiumUpgradeModalProps) {
  const copy = copyMatrix.dashboard.vault.budget;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      layer={layer}
      labelledBy={titleId}
      backdropClassName="bg-[#031F82]/45"
      panelClassName="max-w-sm rounded-nga-xl bg-white p-5"
    >
      <h2
        id={titleId}
        className="font-heading text-lg font-extrabold text-[#031F82]"
      >
        {copy.premiumComingSoonTitle}
      </h2>
      <p className="mt-2 text-sm text-[#1E3A5F]">{copy.premiumComingSoonBody}</p>
      <button
        type="button"
        onClick={onClose}
        className={cn("mt-4 h-touch w-full px-4", orangeCtaClass)}
      >
        {copy.premiumComingSoonDismiss}
      </button>
    </ModalShell>
  );
}
