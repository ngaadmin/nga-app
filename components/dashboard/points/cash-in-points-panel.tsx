"use client";

import { useMemo, useState } from "react";
import { PointsConvertedSuccessModal } from "@/components/dashboard/points/points-converted-success-modal";
import { PointsConversionParentEmailModal } from "@/components/dashboard/points/points-conversion-parent-email-modal";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import {
  convertPointsToAud,
  formatConversionRateLabel,
} from "@/lib/dashboard/point-conversion";
import {
  dispatchPointsConversionParentEmail,
  resolveParentEmailForChild,
  type PointsConversionEmailDispatch,
} from "@/lib/dashboard/points-conversion-email";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0";

export type PointsConvertedPayload = {
  audAmount: number;
  pointsClaimed: number;
};

type CashInPointsPanelProps = {
  className?: string;
  onConverted?: (payload: PointsConvertedPayload) => void;
};

export function CashInPointsPanel({
  className,
  onConverted,
}: CashInPointsPanelProps) {
  const conversionCopy = copyMatrix.dashboard.settings.conversion;
  const { formatMoney, currencyCode } = useCurrency();
  const { username } = useDashboardUser();
  const { totalPoints, audPer100Xp, claimPointsForVault } = useDashboardWallet();

  const [claimError, setClaimError] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [parentEmailModalOpen, setParentEmailModalOpen] = useState(false);
  const [successAudAmount, setSuccessAudAmount] = useState(0);
  const [parentEmailDispatch, setParentEmailDispatch] =
    useState<PointsConversionEmailDispatch | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const conversionRateLabel = formatConversionRateLabel(audPer100Xp, currencyCode);

  const rateHint = conversionCopy.cashInRateHint.replace("{rate}", conversionRateLabel);

  const audPayout = useMemo(
    () => convertPointsToAud(totalPoints, audPer100Xp),
    [audPer100Xp, totalPoints],
  );

  const xpAvailableLabel = conversionCopy.xpAvailableTemplate.replace(
    "{points}",
    totalPoints.toLocaleString(),
  );

  const childPayoutReadout = conversionCopy.childPayoutReadoutTemplate.replace(
    "{amount}",
    formatMoney(audPayout),
  );

  const successBody = conversionCopy.successBodyTemplate.replace(
    "{amount}",
    formatMoney(successAudAmount),
  );

  const canClaim =
    totalPoints > 0 && Number.isFinite(audPayout) && audPayout > 0 && !isClaiming;

  async function handleClaimCashReward() {
    setClaimError(null);

    if (totalPoints <= 0) {
      setClaimError(conversionCopy.noPointsError);
      return;
    }

    setIsClaiming(true);

    try {
      const result = claimPointsForVault(totalPoints);
      if (!result.success) {
        setClaimError(result.error);
        return;
      }

      const parentEmail = resolveParentEmailForChild(username);
      const emailDispatch = await dispatchPointsConversionParentEmail({
        parentEmail,
        childUsername: username,
        amountFormatted: formatMoney(result.audAmount),
        pointsClaimed: result.pointsClaimed,
        conversionRateLabel,
      });

      setSuccessAudAmount(result.audAmount);
      setParentEmailDispatch(emailDispatch);
      setSuccessModalOpen(true);
      onConverted?.({
        audAmount: result.audAmount,
        pointsClaimed: result.pointsClaimed,
      });
    } finally {
      setIsClaiming(false);
    }
  }

  function handleSuccessClose() {
    setSuccessModalOpen(false);
    setParentEmailModalOpen(true);
  }

  return (
    <>
      <div className={cn("min-w-0", className)}>
        <p className="font-heading text-sm font-extrabold text-[#031F82]">
          {conversionCopy.cashInHeading}
        </p>
        <p className="mt-1 font-sans text-xs leading-relaxed text-[#1E3A5F]">
          {rateHint}
        </p>
        <p className="mt-3 font-sans text-xs font-semibold text-[#1E3A5F]">
          {xpAvailableLabel}
        </p>
        <p className="mt-2 font-heading text-xs font-bold leading-snug text-[#031F82]">
          {childPayoutReadout}
        </p>

        {claimError ? (
          <p
            className="mt-2 font-sans text-xs font-semibold text-red-600"
            role="alert"
          >
            {claimError}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleClaimCashReward}
          disabled={!canClaim}
          className={cn("mt-4 h-touch w-full px-4 shadow-md", orangeCtaClass)}
        >
          {isClaiming ? conversionCopy.claimingLabel : conversionCopy.claimCashReward}
        </button>

        <p className="mt-2 font-sans text-[9px] leading-relaxed text-[#1E3A5F]/70">
          {conversionCopy.disclaimer}
        </p>
      </div>

      <PointsConvertedSuccessModal
        isOpen={successModalOpen}
        onClose={handleSuccessClose}
        title={conversionCopy.successTitle}
        body={successBody}
        acknowledgeLabel={conversionCopy.successAcknowledge}
      />

      <PointsConversionParentEmailModal
        isOpen={parentEmailModalOpen}
        dispatch={parentEmailDispatch}
        onClose={() => setParentEmailModalOpen(false)}
      />
    </>
  );
}
