"use client";

import { useEffect, useMemo, useState } from "react";
import { PointsConvertedSuccessModal } from "@/components/dashboard/points/points-converted-success-modal";
import { PointsConversionParentEmailModal } from "@/components/dashboard/points/points-conversion-parent-email-modal";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { persistRegisteredProgressNow } from "@/lib/dashboard/account-progress-sync";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import {
  convertPointsToAud,
  formatConversionRateLabel,
  parsePointsInput,
} from "@/lib/dashboard/point-conversion";
import {
  dispatchPointsConversionParentEmail,
  resolveParentEmailForChild,
  type PointsConversionEmailDispatch,
} from "@/lib/dashboard/points-conversion-email";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import { useVaultProfile } from "@/lib/dashboard/vault/vault-profile-context";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0";

export type PointsConvertedPayload = {
  audAmount: number;
  pointsClaimed: number;
};

type CashInPointsPanelProps = {
  className?: string;
  hideHeading?: boolean;
  onConverted?: (payload: PointsConvertedPayload) => void;
};

export function CashInPointsPanel({
  className,
  hideHeading = false,
  onConverted,
}: CashInPointsPanelProps) {
  const conversionCopy = copyMatrix.dashboard.settings.conversion;
  const { formatMoney, currencyCode } = useCurrency();
  const { username } = useDashboardUser();
  const session = useUserSession();
  const { creditSaveJar, appendLedger } = useVaultProfile();
  const isParentMaster = session?.accountRole === "parent_master";
  const {
    totalPoints,
    audPer100Xp,
    xpExchangeRateSet,
    claimPointsForVault,
  } = useDashboardWallet();

  const [pointsInput, setPointsInput] = useState("");
  const [claimError, setClaimError] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [parentEmailModalOpen, setParentEmailModalOpen] = useState(false);
  const [successAudAmount, setSuccessAudAmount] = useState(0);
  const [parentEmailDispatch, setParentEmailDispatch] =
    useState<PointsConversionEmailDispatch | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    setPointsInput(totalPoints > 0 ? String(totalPoints) : "");
  }, [totalPoints]);

  const conversionRateLabel = formatConversionRateLabel(audPer100Xp, currencyCode);
  const rateHint = xpExchangeRateSet
    ? conversionCopy.cashInRateHint.replace("{rate}", conversionRateLabel)
    : conversionCopy.rateNotSetHint;
  const rateMissingMessage = isParentMaster
    ? conversionCopy.askParentIfParentBody
    : conversionCopy.askParentBody;

  const parsedPoints = parsePointsInput(pointsInput);
  const pointsToClaim = parsedPoints ?? 0;

  const audPayout = useMemo(
    () => convertPointsToAud(pointsToClaim, audPer100Xp),
    [audPer100Xp, pointsToClaim],
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
    xpExchangeRateSet &&
    parsedPoints !== null &&
    parsedPoints > 0 &&
    parsedPoints <= totalPoints &&
    Number.isFinite(audPayout) &&
    audPayout > 0 &&
    !isClaiming;

  async function handleClaimCashReward() {
    setClaimError(null);

    if (!xpExchangeRateSet) {
      setClaimError(rateMissingMessage);
      return;
    }

    if (parsedPoints === null || parsedPoints <= 0) {
      setClaimError(conversionCopy.invalidAmountError);
      return;
    }

    if (parsedPoints > totalPoints) {
      setClaimError(conversionCopy.overBalanceError);
      return;
    }

    setIsClaiming(true);

    try {
      const result = claimPointsForVault(parsedPoints);
      if (!result.success) {
        setClaimError(result.error);
        return;
      }

      creditSaveJar(result.audAmount);
      appendLedger(
        `Cashed in ${result.pointsClaimed.toLocaleString()} XP to Save Jar`,
        { category: "cash_in", amount: result.audAmount, flow: "in", highlight: true },
      );
      await persistRegisteredProgressNow();

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
        {hideHeading ? null : (
          <p className="font-heading text-sm font-extrabold text-[#031F82]">
            {conversionCopy.cashInHeading}
          </p>
        )}
        <p
          className={cn(
            "font-sans text-xs font-semibold text-[#1E3A5F]",
            hideHeading ? "mt-0" : "mt-2",
          )}
        >
          {xpAvailableLabel}
        </p>
        <p className="mt-1 font-sans text-xs leading-relaxed text-[#1E3A5F]">
          {rateHint}
        </p>

        <label className="mt-3 block">
          <span className="font-heading text-xs font-bold text-[#031F82]">
            {conversionCopy.customAmountLabel}
          </span>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pointsInput}
              onChange={(event) => {
                setClaimError(null);
                setPointsInput(event.target.value.replace(/\D/g, ""));
              }}
              placeholder={conversionCopy.customAmountPlaceholder}
              aria-label={conversionCopy.customAmountLabel}
              className="min-w-0 flex-1 rounded-xl border-2 border-[#BDE9FB] bg-[#F7FBFF] px-3 py-2 font-heading text-sm font-bold tabular-nums text-[#031F82] outline-none focus:border-[#0CC1E0]"
            />
            <button
              type="button"
              onClick={() => {
                setClaimError(null);
                setPointsInput(totalPoints > 0 ? String(totalPoints) : "");
              }}
              className="shrink-0 rounded-xl px-2 py-2 font-heading text-[11px] font-bold text-[#0CC1E0] transition-colors hover:bg-[#BDE9FB]/50"
            >
              {conversionCopy.convertFullBalance}
            </button>
          </div>
        </label>

        <p className="mt-2 font-heading text-xs font-bold leading-snug text-[#031F82]">
          {xpExchangeRateSet
            ? childPayoutReadout
            : rateMissingMessage}
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
