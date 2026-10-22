"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PointsConvertedSuccessModal } from "@/components/dashboard/points/points-converted-success-modal";
import { copyMatrix } from "@/constants/copyMatrix";
import {
  adoptCloudWalletRate,
  refreshCashInRateFromCloud,
} from "@/lib/dashboard/adopt-cloud-wallet-rate";
import { cashInRateMissingMessage } from "@/lib/dashboard/class-account-cash-in";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { persistRegisteredProgressNow } from "@/lib/dashboard/account-progress-sync";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { coinWord, fillCoinTemplate } from "@/lib/copy/coin-word";
import { formatConversionRateLabel } from "@/lib/dashboard/point-conversion";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import { useVaultProfile } from "@/lib/dashboard/vault/vault-profile-context";
import { GUEST_SAVE_SIGN_UP_HREF } from "@/lib/onboarding/guest-save-prompt";
import { loadSignedInClassAccountCashIn } from "@/lib/school/class-account-status";
import { quoteXpCashIn } from "@/lib/dashboard/point-conversion";
import {
  cashInLockReason,
  formatXpCashPreview,
  validateCashInPoints,
} from "@/lib/dashboard/xp-cash";
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
  titleId?: string;
  onConverted?: (payload: PointsConvertedPayload) => void;
  onDismiss?: () => void;
};

export function CashInPointsPanel({
  className,
  hideHeading = false,
  titleId = "cash-in-title",
  onConverted,
  onDismiss,
}: CashInPointsPanelProps) {
  const conversionCopy = copyMatrix.dashboard.settings.conversion;
  const { formatMoney, currencyCode } = useCurrency();
  const session = useUserSession();
  const { recordXpCashIn } = useVaultProfile();
  const isParentMaster = session?.accountRole === "parent_master";
  const {
    spendableXp,
    audPer100Xp,
    xpExchangeRateSet,
    exchangeRateCentsPer100Xp,
    claimPointsForVault,
    releaseClaimLock,
  } = useDashboardWallet();

  const [pointsInput, setPointsInput] = useState("");
  const [claimError, setClaimError] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successAudAmount, setSuccessAudAmount] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [classAccountWithoutParent, setClassAccountWithoutParent] = useState<
    boolean | null
  >(null);
  const [classOrStudentSeat, setClassOrStudentSeat] = useState<boolean | null>(null);
  const claimingRef = useRef(false);

  useEffect(() => {
    setSessionReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const classStatus = loadSignedInClassAccountCashIn()
      .then((state) => ({
        classAccountWithoutParent: state.classAccountWithoutParent,
        classOrStudentSeat: state.classOrStudentSeat,
      }))
      .catch(() => ({ classAccountWithoutParent: false, classOrStudentSeat: false }));
    const cloudRate =
      session?.accessMode === "registered"
        ? adoptCloudWalletRate()
        : Promise.resolve();

    void Promise.all([classStatus, cloudRate]).then(([status]) => {
      if (cancelled) return;
      setClassAccountWithoutParent(status.classAccountWithoutParent);
      setClassOrStudentSeat(status.classOrStudentSeat);
    });
    return () => {
      cancelled = true;
    };
  }, [session?.accessMode]);

  const rateCents =
    xpExchangeRateSet && exchangeRateCentsPer100Xp != null
      ? exchangeRateCentsPer100Xp
      : null;
  const conversionRateLabel = formatConversionRateLabel(audPer100Xp, currencyCode);
  const isGuest = sessionReady && session?.accessMode !== "registered";
  const lock = cashInLockReason({
    sessionReady,
    classStatusReady: classAccountWithoutParent !== null && classOrStudentSeat !== null,
    isGuest,
    classAccountWithoutParent: classAccountWithoutParent === true,
    classOrStudentSeat: classOrStudentSeat === true,
    rateSet: rateCents != null,
  });

  const checked = validateCashInPoints(pointsInput, spendableXp);
  const quote = useMemo(() => {
    if (!checked.ok || rateCents == null) return { audCents: 0, pointsCharged: 0 };
    return quoteXpCashIn(checked.points, rateCents);
  }, [checked, rateCents]);
  const audCents = quote.audCents;
  const audPayout = audCents / 100;

  const xpAvailableLabel = fillCoinTemplate(
    conversionCopy.xpAvailableTemplate,
    spendableXp,
  );
  const amountProblem =
    pointsInput.trim() && !checked.ok ? amountError(checked.error) : null;
  const preview = amountProblem
    ? amountProblem
    : checked.ok && audCents > 0
      ? formatXpCashPreview(quote.pointsCharged, formatMoney(audPayout))
      : checked.ok && rateCents != null
        ? conversionCopy.zeroPayoutError
        : conversionCopy.chooseAmountHint;
  const partialUse =
    checked.ok && quote.pointsCharged > 0 && quote.pointsCharged < checked.points
      ? fillCoinTemplate(conversionCopy.partialUseTemplate, quote.pointsCharged)
      : null;
  const successBody = conversionCopy.successBodyTemplate.replace(
    "{amount}",
    formatMoney(successAudAmount),
  );
  const canClaim =
    lock === "ready" && checked.ok && audCents > 0 && !isClaiming;

  function amountError(kind: "empty" | "not-whole" | "not-positive" | "over-balance" | "invalid") {
    if (kind === "over-balance") return conversionCopy.overBalanceError;
    if (kind === "empty") return conversionCopy.noPointsError;
    return conversionCopy.invalidAmountError;
  }

  async function handleClaimCashReward() {
    setClaimError(null);
    if (lock !== "ready" || claimingRef.current) return;
    claimingRef.current = true;
    setIsClaiming(true);

    let classAccount = classOrStudentSeat === true;
    try {
      const state = await loadSignedInClassAccountCashIn();
      classAccount = state.classOrStudentSeat;
      setClassAccountWithoutParent(state.classAccountWithoutParent);
      setClassOrStudentSeat(state.classOrStudentSeat);
    } catch {
      classAccount = classOrStudentSeat === true;
    }
    if (classAccount || isGuest) {
      claimingRef.current = false;
      setIsClaiming(false);
      return;
    }

    const fresh = validateCashInPoints(pointsInput, spendableXp);
    if (!fresh.ok) {
      setClaimError(amountError(fresh.error));
      claimingRef.current = false;
      setIsClaiming(false);
      return;
    }

    const currentRate = await refreshCashInRateFromCloud();
    if (!currentRate.ok) {
      setClaimError("Could not check the current rate. Try again.");
      claimingRef.current = false;
      setIsClaiming(false);
      return;
    }

    let holdLock = false;
    try {
      const result = claimPointsForVault(fresh.points);
      if (!result.success) {
        if (result.error !== "busy") {
          setClaimError(
            result.error === "over-balance"
              ? conversionCopy.overBalanceError
              : result.error === "zero-payout"
                ? conversionCopy.zeroPayoutError
                : result.error === "no-rate"
                  ? cashInRateMissingMessage({
                      classAccountWithoutParent: false,
                      isParentMaster,
                      askParentBody: conversionCopy.askParentBody,
                      askParentIfParentBody: conversionCopy.askParentIfParentBody,
                    })
                  : conversionCopy.invalidAmountError,
          );
        }
        return;
      }
      holdLock = true;

      recordXpCashIn(
        result.audCents,
        `Cashed in ${result.pointsClaimed.toLocaleString()} ${coinWord(result.pointsClaimed)} to Cash`,
      );
      await persistRegisteredProgressNow();

      setPointsInput("");
      setSuccessAudAmount(result.audAmount);
      setSuccessModalOpen(true);
      onConverted?.({
        audAmount: result.audAmount,
        pointsClaimed: result.pointsClaimed,
      });
    } finally {
      if (holdLock) releaseClaimLock();
      claimingRef.current = false;
      setIsClaiming(false);
    }
  }

  function handleSuccessClose() {
    setSuccessModalOpen(false);
  }

  if (lock === "class-seat") return null;

  const cardTitle =
    lock === "rate-missing" ? conversionCopy.askParentTitle : conversionCopy.cashInHeading;

  const lockedMessage =
    lock === "guest"
      ? conversionCopy.guestCashInBody
      : lock === "rate-missing"
        ? cashInRateMissingMessage({
            classAccountWithoutParent: false,
            isParentMaster,
            askParentBody: conversionCopy.askParentBody,
            askParentIfParentBody: conversionCopy.askParentIfParentBody,
          })
        : conversionCopy.checkingAccount;

  return (
    <>
      <div className={cn("min-w-0", className)}>
        {hideHeading ? null : (
          <h2 id={titleId} className="font-heading text-lg font-extrabold leading-tight text-[#031F82]">
            {cardTitle}
          </h2>
        )}

        {lock !== "ready" ? (
          <div className="mt-2 space-y-3">
            <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{lockedMessage}</p>
            {lock === "guest" ? (
              <Link
                href={GUEST_SAVE_SIGN_UP_HREF}
                className={cn("flex h-touch w-full items-center justify-center px-4 shadow-md", orangeCtaClass)}
              >
                {conversionCopy.guestCashInAction}
              </Link>
            ) : null}
            {lock === "rate-missing" && onDismiss ? (
              <button
                type="button"
                onClick={onDismiss}
                className={cn("flex h-touch w-full items-center justify-center px-4 shadow-md", orangeCtaClass)}
              >
                Got it
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <p className="mt-2 font-sans text-xs font-semibold text-[#1E3A5F]">
              {xpAvailableLabel}
            </p>
            <p className="mt-1 font-sans text-xs leading-relaxed text-[#1E3A5F]">
              {conversionCopy.cashInRateHint.replace("{rate}", conversionRateLabel)}
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
                    setPointsInput(event.target.value);
                  }}
                  placeholder={conversionCopy.customAmountPlaceholder}
                  aria-label={conversionCopy.customAmountLabel}
                  className="min-w-0 flex-1 rounded-xl border-2 border-[#BDE9FB] bg-[#F7FBFF] px-3 py-2 font-heading text-sm font-bold tabular-nums text-[#031F82] outline-none focus:border-[#0CC1E0]"
                />
              </div>
            </label>
            <button
              type="button"
              onClick={() => {
                setClaimError(null);
                setPointsInput(spendableXp > 0 ? String(spendableXp) : "");
              }}
              disabled={spendableXp <= 0}
              className="mt-2 h-touch w-full rounded-nga-lg border-2 border-[#0CC1E0] bg-white px-4 font-heading text-sm font-bold text-[#031F82] transition-colors hover:bg-[#BDE9FB]/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {conversionCopy.convertFullBalance}
            </button>

            <p
              className="mt-2 font-heading text-xs font-bold leading-snug text-[#031F82]"
              role={amountProblem ? "alert" : undefined}
            >
              {preview}
            </p>
            {partialUse ? (
              <p className="mt-1 font-sans text-xs leading-relaxed text-[#1E3A5F]">{partialUse}</p>
            ) : null}
            <p className="mt-1 font-sans text-xs leading-relaxed text-[#1E3A5F]">
              {conversionCopy.cashDestinationHint}
            </p>

            {claimError ? (
              <p className="mt-2 font-sans text-xs font-semibold text-[#031F82]" role="alert">
                {claimError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => {
                void handleClaimCashReward();
              }}
              disabled={!canClaim}
              className={cn("mt-4 h-touch w-full px-4 shadow-md", orangeCtaClass)}
            >
              {isClaiming ? conversionCopy.claimingLabel : conversionCopy.claimCashReward}
            </button>
          </>
        )}

        {lock === "ready" ? (
          <p className="mt-2 font-sans text-[11px] leading-relaxed text-[#1E3A5F]/80">
            {conversionCopy.disclaimer}
          </p>
        ) : null}
      </div>

      <PointsConvertedSuccessModal
        isOpen={successModalOpen}
        onClose={handleSuccessClose}
        title={conversionCopy.successTitle}
        body={successBody}
        acknowledgeLabel={conversionCopy.successAcknowledge}
      />
    </>
  );
}
