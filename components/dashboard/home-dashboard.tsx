"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSectionHeading } from "@/components/dashboard/dashboard-section-heading";
import { copyMatrix } from "@/constants/copyMatrix";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { clearGhostAccessSession } from "@/lib/onboarding/ghost-session";
import { clearDashboardWalletState } from "@/lib/dashboard/dashboard-wallet-storage";
import {
  convertPointsToAud,
  formatAud,
  formatConversionRateLabel,
  MAX_AUD_SLIDER_INDEX,
  MIN_AUD_SLIDER_INDEX,
  parsePointsInput,
} from "@/lib/dashboard/point-conversion";
import { cn } from "@/lib/utils/cn";

const floatingPanelClass = "rounded-2xl border-0 bg-white shadow-md";

const accountLinkClass =
  "font-heading text-sm font-bold text-[#0CC1E0] transition-colors hover:text-[#031F82] active:opacity-70";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-sm font-bold text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0";

type ParentModeSwitchProps = {
  enabled: boolean;
  label: string;
  onToggle: () => void;
};

function ParentModeSwitch({ enabled, label, onToggle }: ParentModeSwitchProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="font-heading text-sm font-bold text-[#031F82]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-9 w-[3.75rem] shrink-0 items-center rounded-full p-1 shadow-inner transition-colors duration-200",
          enabled ? "bg-[#0CC1E0]" : "bg-[#BDE9FB]/60",
        )}
      >
        <span
          className={cn(
            "pointer-events-none block size-7 rounded-full bg-white shadow-md transition-transform duration-200",
            enabled ? "translate-x-[1.65rem]" : "translate-x-0",
          )}
        />
      </button>
      <span
        className={cn(
          "font-heading text-[10px] font-bold uppercase tracking-wide",
          enabled ? "text-[#0CC1E0]" : "text-[#1E3A5F]/50",
        )}
      >
        {enabled ? "Parent mode on" : "Parent mode off"}
      </span>
    </div>
  );
}

type PointsConvertedSuccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  body: string;
  acknowledgeLabel: string;
};

function PointsConvertedSuccessModal({
  isOpen,
  onClose,
  title,
  body,
  acknowledgeLabel,
}: PointsConvertedSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#031F82]/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="points-converted-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border-0 bg-white p-5 shadow-md sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#FFA503]">
          {title}
        </p>
        <h2
          id="points-converted-title"
          className="mt-2 font-heading text-xl font-extrabold leading-tight text-[#031F82] sm:text-2xl"
        >
          {title}
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-[#1E3A5F]">
          {body}
        </p>
        <button
          type="button"
          onClick={onClose}
          className={cn("mt-5 h-touch w-full px-6 shadow-md", orangeCtaClass)}
        >
          {acknowledgeLabel}
        </button>
      </div>
    </div>
  );
}

export function HomeDashboard() {
  const router = useRouter();
  const copy = copyMatrix.dashboard.home;
  const conversionCopy = copy.conversion;

  const {
    totalPoints,
    audSliderIndex,
    audPer100Xp,
    setAudSliderIndex,
    claimPointsForVault,
  } = useDashboardWallet();

  const [parentModeEnabled, setParentModeEnabled] = useState(false);
  const [pointsInput, setPointsInput] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successAudAmount, setSuccessAudAmount] = useState(0);
  const [claimError, setClaimError] = useState<string | null>(null);

  const selectedPoints = useMemo(
    () => parsePointsInput(pointsInput) ?? 0,
    [pointsInput],
  );

  const isFullBalanceSelected =
    totalPoints > 0 && selectedPoints === totalPoints;

  const audPayout = useMemo(
    () => convertPointsToAud(selectedPoints, audPer100Xp),
    [selectedPoints, audPer100Xp],
  );

  const conversionRateLabel = formatConversionRateLabel(audPer100Xp);

  const childPayoutReadout = conversionCopy.childPayoutReadoutTemplate.replace(
    "{amount}",
    formatAud(audPayout),
  );

  const successBody = conversionCopy.successBodyTemplate.replace(
    "{amount}",
    formatAud(successAudAmount),
  );

  const canClaim =
    selectedPoints > 0 &&
    selectedPoints <= totalPoints &&
    Number.isFinite(audPayout) &&
    audPayout > 0;

  function handleLogOut() {
    clearGhostAccessSession();
    clearDashboardWalletState();
    router.push("/onboarding/start");
  }

  function handleSelectFullBalance() {
    setClaimError(null);
    if (totalPoints <= 0) {
      setPointsInput("");
      return;
    }
    setPointsInput(String(totalPoints));
  }

  function handleClaimCashReward() {
    setClaimError(null);
    const result = claimPointsForVault(selectedPoints);
    if (!result.success) {
      setClaimError(result.error);
      return;
    }

    setSuccessAudAmount(result.audAmount);
    setPointsInput("");
    setSuccessModalOpen(true);
  }

  return (
    <>
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col space-y-14 overflow-x-hidden bg-white px-2 py-6 pb-10">
        <section
          aria-labelledby="account-settings-heading"
          className="w-full text-center"
        >
          <DashboardSectionHeading id="account-settings-heading">
            Account & Settings
          </DashboardSectionHeading>
          <div className="mt-5 flex flex-col items-center gap-4">
            <button type="button" className={accountLinkClass}>
              {copy.account.passwordReset}
            </button>
            <button type="button" className={accountLinkClass}>
              {copy.account.subscriptionStatus}
            </button>
            <button
              type="button"
              onClick={handleLogOut}
              className={cn(accountLinkClass, "text-[#031F82]")}
            >
              {copy.account.logOut}
            </button>
          </div>
        </section>

        <section
          aria-labelledby="shared-device-heading"
          className={cn(floatingPanelClass, "mx-auto w-full max-w-sm p-5")}
        >
          <DashboardSectionHeading id="shared-device-heading" className="mb-5">
            Shared Device
          </DashboardSectionHeading>
          <ParentModeSwitch
            enabled={parentModeEnabled}
            label={copy.parentMode.label}
            onToggle={() => setParentModeEnabled((enabled) => !enabled)}
          />
          {parentModeEnabled ? (
            <p className="mt-4 text-center font-sans text-[10px] leading-relaxed text-[#1E3A5F]">
              {copy.parentMode.enabledHint}
            </p>
          ) : null}
        </section>

        {parentModeEnabled ? (
          <section
            aria-labelledby="conversion-rate-heading"
            className={cn(floatingPanelClass, "mx-auto w-full max-w-sm p-5")}
          >
            <DashboardSectionHeading
              id="conversion-rate-heading"
              className="mb-4"
            >
              {conversionCopy.heading}
            </DashboardSectionHeading>

            <p className="text-center font-heading text-base font-extrabold text-[#031F82] sm:text-lg">
              {conversionRateLabel}
            </p>

            <label className="mt-5 block">
              <span className="sr-only">{conversionCopy.heading}</span>
              <input
                type="range"
                min={MIN_AUD_SLIDER_INDEX}
                max={MAX_AUD_SLIDER_INDEX}
                step={1}
                value={audSliderIndex}
                onChange={(event) => {
                  const next = Number.parseInt(event.target.value, 10);
                  if (Number.isFinite(next)) setAudSliderIndex(next);
                }}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#BDE9FB]/50 accent-[#0CC1E0]"
              />
            </label>

            <p className="mt-4 text-center font-sans text-[10px] leading-relaxed text-[#1E3A5F]">
              {conversionCopy.summary}
            </p>
          </section>
        ) : (
          <section
            aria-labelledby="cash-in-heading"
            className={cn(floatingPanelClass, "mx-auto w-full max-w-sm p-5")}
          >
            <DashboardSectionHeading id="cash-in-heading" className="mb-2">
              {conversionCopy.cashInHeading}
            </DashboardSectionHeading>
            <p className="mb-4 text-center font-sans text-[10px] leading-relaxed text-[#1E3A5F]">
              {conversionCopy.cashInRateHint}
            </p>
            <p className="text-center font-heading text-base font-extrabold text-[#031F82] sm:text-lg">
              {conversionRateLabel}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSelectFullBalance}
                aria-pressed={isFullBalanceSelected}
                className={cn(
                  "rounded-2xl px-4 py-3 text-center font-heading text-sm font-bold transition-all",
                  isFullBalanceSelected
                    ? "bg-[#BDE9FB]/50 text-[#031F82] shadow-sm ring-2 ring-[#0CC1E0]/30"
                    : "bg-[#BDE9FB]/20 text-[#1E3A5F] hover:bg-[#BDE9FB]/35",
                )}
              >
                {conversionCopy.convertFullBalance}
                <span className="mt-1 block font-sans text-[10px] font-semibold opacity-80">
                  {totalPoints.toLocaleString()} XP available
                </span>
              </button>

              <div
                className={cn(
                  "rounded-2xl p-3 transition-all",
                  pointsInput.trim().length > 0 && !isFullBalanceSelected
                    ? "bg-[#BDE9FB]/50 shadow-sm ring-2 ring-[#0CC1E0]/30"
                    : "bg-[#BDE9FB]/20",
                )}
              >
                <label className="block">
                  <span className="font-heading text-sm font-bold text-[#031F82]">
                    {conversionCopy.customAmountLabel}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder={conversionCopy.customAmountPlaceholder}
                    value={pointsInput}
                    onChange={(event) => {
                      setClaimError(null);
                      const nextValue = event.target.value.replace(/[^\d]/g, "");
                      setPointsInput(nextValue);
                    }}
                    aria-label={conversionCopy.customAmountLabel}
                    className="mt-2 w-full rounded-xl border-0 bg-white px-3 py-2 font-sans text-sm text-[#031F82] shadow-sm outline-none ring-0 focus:ring-2 focus:ring-[#0CC1E0]/30"
                  />
                </label>
              </div>
            </div>

            <p className="mt-4 text-center font-heading text-sm font-bold leading-snug text-[#031F82]">
              {childPayoutReadout}
            </p>

            {claimError ? (
              <p className="mt-2 text-center font-sans text-xs font-semibold text-red-600" role="alert">
                {claimError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleClaimCashReward}
              disabled={!canClaim}
              className={cn("mt-4 h-touch w-full px-6 shadow-md", orangeCtaClass)}
            >
              {conversionCopy.claimCashReward}
            </button>

            <p className="mt-3 text-center font-sans text-[9px] leading-relaxed text-[#1E3A5F]/70">
              {conversionCopy.disclaimer}
            </p>
          </section>
        )}
      </div>

      <PointsConvertedSuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title={conversionCopy.successTitle}
        body={successBody}
        acknowledgeLabel={conversionCopy.successAcknowledge}
      />
    </>
  );
}
