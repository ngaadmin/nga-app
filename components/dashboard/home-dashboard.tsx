"use client";

import { useMemo, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { clearAllAppSessionState } from "@/lib/onboarding/clear-app-session-state";
import {
  BillingCardIcon,
  KeyIcon,
  LockIcon,
  LogOutIcon,
} from "@/lib/dashboard/icons";
import {
  dispatchParentPinRecoveryEmail,
  isParentPinConfigured,
  isValidPinFormat,
  resolveSimulatedParentEmail,
  resetParentPinToRecovery,
  saveParentPin,
  verifyParentPin,
} from "@/lib/dashboard/parent-pin";
import {
  convertPointsToAud,
  formatAud,
  formatConversionRateLabel,
  MAX_AUD_SLIDER_INDEX,
  MIN_AUD_SLIDER_INDEX,
  parsePointsInput,
} from "@/lib/dashboard/point-conversion";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";
import { cn } from "@/lib/utils/cn";

const floatingPanelClass = "rounded-2xl border-0 bg-white shadow-md";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0";

const pinInputClass =
  "w-full rounded-xl border-2 border-[#BDE9FB] bg-[#F7FBFF] px-4 py-2.5 text-center font-heading text-lg font-bold tracking-[0.35em] text-[#031F82] outline-none focus:border-[#0CC1E0]";

function formatJoinDate(isoDate: string | null): string {
  if (!isoDate) return "Recently";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "Recently";
  return parsed.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type SettingsRowProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
};

function SettingsRow({ icon: Icon, label, onClick }: SettingsRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-3.5 text-left transition-colors hover:bg-[#BDE9FB]/15"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#BDE9FB]/35 text-[#0CC1E0]">
        <Icon className="size-4" />
      </span>
      <span className="font-heading text-sm font-bold text-[#031F82]">
        {label}
      </span>
    </button>
  );
}

type ProfileHeaderProps = {
  username: string;
  joinDateLabel: string;
  joinDate: string | null;
  isLoading: boolean;
};

function ProfileHeader({
  username,
  joinDateLabel,
  joinDate,
  isLoading,
}: ProfileHeaderProps) {
  const initial = username.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="flex items-center gap-4">
      <div
        className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#0CC1E0] font-heading text-2xl font-extrabold text-white shadow-md"
        aria-hidden
      >
        {isLoading ? "…" : initial}
      </div>
      <div className="min-w-0">
        <h1 className="truncate font-heading text-xl font-extrabold text-[#031F82] sm:text-2xl">
          {isLoading ? "Loading…" : username}
        </h1>
        <p className="mt-1 font-sans text-sm text-[#1E3A5F]/75">
          {joinDateLabel} {formatJoinDate(joinDate)}
        </p>
      </div>
    </header>
  );
}

type CompactParentModeSwitchProps = {
  enabled: boolean;
  label: string;
  onToggle: () => void;
};

function CompactParentModeSwitch({
  enabled,
  label,
  onToggle,
}: CompactParentModeSwitchProps) {
  return (
    <div className="flex flex-col items-center justify-start gap-2 self-start text-center">
      <span className="font-heading text-[10px] font-bold uppercase leading-tight tracking-wide text-[#031F82]">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full p-1 shadow-inner transition-colors duration-200",
          enabled ? "bg-[#0CC1E0]" : "bg-[#BDE9FB]/60",
        )}
      >
        <span
          className={cn(
            "pointer-events-none block size-6 rounded-full bg-white shadow-md transition-transform duration-200",
            enabled ? "translate-x-[1.35rem]" : "translate-x-0",
          )}
        />
      </button>
      <span
        className={cn(
          "font-heading text-[9px] font-bold uppercase tracking-wide",
          enabled ? "text-[#0CC1E0]" : "text-[#1E3A5F]/50",
        )}
      >
        {enabled ? "On" : "Off"}
      </span>
    </div>
  );
}

type ParentPinGateProps = {
  mode: "verify" | "setup";
  isOpen: boolean;
  title: string;
  body: string;
  placeholder: string;
  confirmPlaceholder?: string;
  newPinLabel?: string;
  confirmLabel: string;
  cancelLabel: string;
  error: string | null;
  pinValue: string;
  confirmPinValue?: string;
  onPinChange: (value: string) => void;
  onConfirmPinChange?: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

function ParentPinGate({
  mode,
  isOpen,
  title,
  body,
  placeholder,
  confirmPlaceholder,
  newPinLabel,
  confirmLabel,
  cancelLabel,
  error,
  pinValue,
  confirmPinValue = "",
  onPinChange,
  onConfirmPinChange,
  onConfirm,
  onCancel,
}: ParentPinGateProps) {
  if (!isOpen) return null;

  const canConfirm =
    mode === "setup"
      ? isValidPinFormat(pinValue) && isValidPinFormat(confirmPinValue)
      : isValidPinFormat(pinValue);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onCancel}
      layer="toast"
      labelledBy="parent-pin-title"
      backdropClassName="bg-[#031F82]/55"
      panelClassName="rounded-2xl border-0 bg-white p-5 shadow-md"
    >
        <h2
          id="parent-pin-title"
          className="font-heading text-lg font-extrabold text-[#031F82]"
        >
          {title}
        </h2>
        <p className="mt-2 font-sans text-sm leading-relaxed text-[#1E3A5F]">
          {body}
        </p>
        {mode === "setup" ? (
          <div className="mt-4 space-y-3">
            <PinField
              id="setup-parent-pin"
              label={newPinLabel ?? placeholder}
              value={pinValue}
              onChange={(value) => {
                onPinChange(value);
              }}
            />
            <PinField
              id="setup-parent-pin-confirm"
              label={confirmPlaceholder ?? "Confirm new PIN"}
              value={confirmPinValue}
              onChange={(value) => onConfirmPinChange?.(value)}
            />
          </div>
        ) : (
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            autoComplete="off"
            placeholder={placeholder}
            value={pinValue}
            onChange={(event) => {
              onPinChange(event.target.value.replace(/\D/g, "").slice(0, 4));
            }}
            aria-label={placeholder}
            className={cn("mt-4", pinInputClass)}
          />
        )}
        {error ? (
          <p className="mt-2 font-sans text-xs font-semibold text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canConfirm}
          className={cn("mt-4 h-touch w-full px-6 shadow-md", orangeCtaClass)}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 w-full rounded-nga-lg px-4 py-2 font-heading text-sm font-bold text-[#0CC1E0] transition-colors hover:bg-[#BDE9FB]/60"
        >
          {cancelLabel}
        </button>
    </ModalShell>
  );
}

type PinFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function PinField({ id, label, value, onChange }: PinFieldProps) {
  return (
    <label className="block">
      <span className="font-heading text-xs font-bold text-[#031F82]">
        {label}
      </span>
      <input
        id={id}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        autoComplete="off"
        value={value}
        onChange={(event) => {
          onChange(event.target.value.replace(/\D/g, "").slice(0, 4));
        }}
        aria-label={label}
        className={cn("mt-1.5", pinInputClass)}
      />
    </label>
  );
}

type ChangeParentPinModalProps = {
  isOpen: boolean;
  copy: (typeof copyMatrix.dashboard.settings)["changePin"];
  parentEmail: string;
  onClose: () => void;
};

function ChangeParentPinModal({
  isOpen,
  copy,
  parentEmail,
  onClose,
}: ChangeParentPinModalProps) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  function resetForm() {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setError(null);
    setRecoveryNotice(null);
    setIsRecovering(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleForgotPin() {
    setError(null);
    setRecoveryNotice(null);
    setIsRecovering(true);

    try {
      resetParentPinToRecovery();
      const result = await dispatchParentPinRecoveryEmail(parentEmail);
      setRecoveryNotice(
        copy.forgotPinSuccess
          .replace("{code}", result.recoveryCode)
          .replace("{email}", result.email),
      );
    } finally {
      setIsRecovering(false);
    }
  }

  function handleSave() {
    if (!isParentPinConfigured()) {
      setError(copy.currentError);
      return;
    }
    if (!verifyParentPin(currentPin)) {
      setError(copy.currentError);
      return;
    }
    if (!isValidPinFormat(newPin)) {
      setError(copy.newInvalid);
      return;
    }
    if (newPin !== confirmPin) {
      setError(copy.mismatch);
      return;
    }
    if (newPin === currentPin) {
      setError(copy.sameAsOld);
      return;
    }

    saveParentPin(newPin);
    resetForm();
    onClose();
  }

  if (!isOpen) return null;

  const canSave =
    isValidPinFormat(currentPin) &&
    isValidPinFormat(newPin) &&
    isValidPinFormat(confirmPin);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      layer="toast"
      labelledBy="change-parent-pin-title"
      backdropClassName="bg-[#031F82]/55"
      panelClassName="rounded-2xl border-0 bg-white p-5 shadow-md"
    >
        <h2
          id="change-parent-pin-title"
          className="font-heading text-lg font-extrabold text-[#031F82]"
        >
          {copy.title}
        </h2>
        <p className="mt-2 font-sans text-sm leading-relaxed text-[#1E3A5F]">
          {copy.body}
        </p>

        <div className="mt-4 space-y-3">
          <PinField
            id="current-parent-pin"
            label={copy.currentLabel}
            value={currentPin}
            onChange={(value) => {
              setError(null);
              setCurrentPin(value);
            }}
          />
          <PinField
            id="new-parent-pin"
            label={copy.newLabel}
            value={newPin}
            onChange={(value) => {
              setError(null);
              setNewPin(value);
            }}
          />
          <PinField
            id="confirm-parent-pin"
            label={copy.confirmLabel}
            value={confirmPin}
            onChange={(value) => {
              setError(null);
              setConfirmPin(value);
            }}
          />
        </div>

        {error ? (
          <p className="mt-3 font-sans text-xs font-semibold text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {recoveryNotice ? (
          <p className="mt-3 rounded-xl bg-[#BDE9FB]/35 px-3 py-2 font-sans text-xs leading-relaxed text-[#031F82]">
            {recoveryNotice}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleForgotPin}
          disabled={isRecovering}
          className="mt-4 w-full font-heading text-sm font-bold text-[#0CC1E0] underline-offset-4 transition-colors hover:text-[#031F82] hover:underline disabled:opacity-50"
        >
          {isRecovering ? copy.forgotPinSending : copy.forgotPin}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={cn("mt-4 h-touch w-full px-6 shadow-md", orangeCtaClass)}
        >
          {copy.save}
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="mt-3 w-full rounded-nga-lg px-4 py-2 font-heading text-sm font-bold text-[#0CC1E0] transition-colors hover:bg-[#BDE9FB]/60"
        >
          {copy.cancel}
        </button>
    </ModalShell>
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
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      layer="toast"
      labelledBy="points-converted-title"
      backdropClassName="bg-[#031F82]/50"
      panelClassName="rounded-2xl border-0 bg-white p-5 shadow-md sm:p-6"
    >
        <h2
          id="points-converted-title"
          className="font-heading text-xl font-extrabold leading-tight text-[#031F82] sm:text-2xl"
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
    </ModalShell>
  );
}

type FinancialPanelContentProps = {
  parentModeEnabled: boolean;
  conversionCopy: (typeof copyMatrix.dashboard.settings)["conversion"];
  parentModeHint: string;
  conversionRateLabel: string;
  audSliderIndex: number;
  setAudSliderIndex: (index: number) => void;
  totalPoints: number;
  pointsInput: string;
  setPointsInput: (value: string) => void;
  setClaimError: (value: string | null) => void;
  isFullBalanceSelected: boolean;
  onSelectFullBalance: () => void;
  childPayoutReadout: string;
  claimError: string | null;
  canClaim: boolean;
  onClaimCashReward: () => void;
};

function FinancialPanelContent({
  parentModeEnabled,
  conversionCopy,
  parentModeHint,
  conversionRateLabel,
  audSliderIndex,
  setAudSliderIndex,
  totalPoints,
  pointsInput,
  setPointsInput,
  setClaimError,
  isFullBalanceSelected,
  onSelectFullBalance,
  childPayoutReadout,
  claimError,
  canClaim,
  onClaimCashReward,
}: FinancialPanelContentProps) {
  if (parentModeEnabled) {
    return (
      <div className="min-w-0">
        <p className="font-heading text-sm font-extrabold text-[#031F82]">
          {conversionCopy.heading}
        </p>
        <p className="mt-2 font-heading text-base font-extrabold text-[#031F82]">
          {conversionRateLabel}
        </p>
        <label className="mt-4 block">
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
        <p className="mt-3 font-sans text-[10px] leading-relaxed text-[#1E3A5F]">
          {conversionCopy.summary}
        </p>
        <p className="mt-2 font-sans text-[10px] leading-relaxed text-[#0CC1E0]">
          {parentModeHint}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <p className="font-heading text-sm font-extrabold text-[#031F82]">
        {conversionCopy.cashInHeading}
      </p>
      <p className="mt-1 font-sans text-[10px] leading-relaxed text-[#1E3A5F]">
        {conversionCopy.cashInRateHint}
      </p>
      <p className="mt-2 font-heading text-base font-extrabold text-[#031F82]">
        {conversionRateLabel}
      </p>

      <div className="mt-4 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onSelectFullBalance}
          aria-pressed={isFullBalanceSelected}
          className={cn(
            "rounded-xl px-3 py-2.5 text-left font-heading text-xs font-bold transition-all",
            isFullBalanceSelected
              ? "bg-[#BDE9FB]/50 text-[#031F82] ring-2 ring-[#0CC1E0]/30"
              : "bg-[#BDE9FB]/20 text-[#1E3A5F] hover:bg-[#BDE9FB]/35",
          )}
        >
          {conversionCopy.convertFullBalance}
          <span className="mt-0.5 block font-sans text-[10px] font-semibold opacity-80">
            {totalPoints.toLocaleString()} XP available
          </span>
        </button>

        <div
          className={cn(
            "rounded-xl p-2.5 transition-all",
            pointsInput.trim().length > 0 && !isFullBalanceSelected
              ? "bg-[#BDE9FB]/50 ring-2 ring-[#0CC1E0]/30"
              : "bg-[#BDE9FB]/20",
          )}
        >
          <label className="block">
            <span className="font-heading text-xs font-bold text-[#031F82]">
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
                setPointsInput(event.target.value.replace(/[^\d]/g, ""));
              }}
              aria-label={conversionCopy.customAmountLabel}
              className="mt-1.5 w-full rounded-lg border-0 bg-white px-3 py-2 font-sans text-sm text-[#031F82] shadow-sm outline-none focus:ring-2 focus:ring-[#0CC1E0]/30"
            />
          </label>
        </div>
      </div>

      <p className="mt-3 font-heading text-xs font-bold leading-snug text-[#031F82]">
        {childPayoutReadout}
      </p>

      {claimError ? (
        <p className="mt-1.5 font-sans text-xs font-semibold text-red-600" role="alert">
          {claimError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onClaimCashReward}
        disabled={!canClaim}
        className={cn("mt-3 h-10 w-full px-4 text-xs shadow-md", orangeCtaClass)}
      >
        {conversionCopy.claimCashReward}
      </button>

      <p className="mt-2 font-sans text-[9px] leading-relaxed text-[#1E3A5F]/70">
        {conversionCopy.disclaimer}
      </p>
    </div>
  );
}

export function HomeDashboard() {
  const router = useRouter();
  const { username, joinDate, isLoading } = useDashboardUser();
  const copy = copyMatrix.dashboard.settings;
  const conversionCopy = copy.conversion;

  const {
    totalPoints,
    audSliderIndex,
    audPer100Xp,
    setAudSliderIndex,
    claimPointsForVault,
  } = useDashboardWallet();

  const [parentModeEnabled, setParentModeEnabled] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<"verify" | "setup">("verify");
  const [changePinModalOpen, setChangePinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinConfirmInput, setPinConfirmInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
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

  const simulatedParentEmail = useMemo(
    () => resolveSimulatedParentEmail(username),
    [username],
  );

  function handleLogOut() {
    clearAllAppSessionState();
    router.push("/onboarding/start");
  }

  function handleParentModeToggle() {
    if (parentModeEnabled) {
      setParentModeEnabled(false);
      return;
    }
    setPinError(null);
    setPinInput("");
    setPinConfirmInput("");
    setPinModalMode(isParentPinConfigured() ? "verify" : "setup");
    setPinModalOpen(true);
  }

  function handlePinConfirm() {
    if (pinModalMode === "setup") {
      if (!isValidPinFormat(pinInput) || pinInput !== pinConfirmInput) {
        setPinError(copy.parentMode.setupMismatch);
        return;
      }
      saveParentPin(pinInput);
      setPinError(null);
      setParentModeEnabled(true);
      setPinModalOpen(false);
      setPinInput("");
      setPinConfirmInput("");
      return;
    }

    if (!verifyParentPin(pinInput)) {
      setPinError(copy.parentMode.pinError);
      return;
    }
    setPinError(null);
    setParentModeEnabled(true);
    setPinModalOpen(false);
    setPinInput("");
    setPinConfirmInput("");
  }

  function handlePinCancel() {
    setPinModalOpen(false);
    setPinInput("");
    setPinConfirmInput("");
    setPinError(null);
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
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-6 overflow-x-hidden bg-white px-2 py-4 pb-8">
        <ProfileHeader
          username={username}
          joinDateLabel={copy.profile.joinDateLabel}
          joinDate={joinDate}
          isLoading={isLoading}
        />

        <nav
          aria-label="Account settings"
          className={cn(floatingPanelClass, "divide-y divide-[#BDE9FB]/60 px-3")}
        >
          <SettingsRow
            icon={KeyIcon}
            label={copy.account.passwordReset}
          />
          <SettingsRow
            icon={LockIcon}
            label={copy.account.changeParentPin}
            onClick={() => setChangePinModalOpen(true)}
          />
          <SettingsRow
            icon={BillingCardIcon}
            label={copy.account.subscriptionStatus}
          />
          <SettingsRow
            icon={LogOutIcon}
            label={copy.account.logOut}
            onClick={handleLogOut}
          />
        </nav>

        <section
          aria-labelledby="cash-in-heading"
          className={cn(floatingPanelClass, "p-4")}
        >
          <h2 id="cash-in-heading" className="sr-only">
            {conversionCopy.cashInHeading}
          </h2>

          <div className="grid grid-cols-[minmax(0,25%)_minmax(0,75%)] items-start gap-3">
            <div className="flex items-start border-r border-[#BDE9FB]/60 pr-2">
              <CompactParentModeSwitch
                enabled={parentModeEnabled}
                label={copy.parentMode.shortLabel}
                onToggle={handleParentModeToggle}
              />
            </div>

            <FinancialPanelContent
              parentModeEnabled={parentModeEnabled}
              conversionCopy={conversionCopy}
              parentModeHint={copy.parentMode.enabledHint}
              conversionRateLabel={conversionRateLabel}
              audSliderIndex={audSliderIndex}
              setAudSliderIndex={setAudSliderIndex}
              totalPoints={totalPoints}
              pointsInput={pointsInput}
              setPointsInput={setPointsInput}
              setClaimError={setClaimError}
              isFullBalanceSelected={isFullBalanceSelected}
              onSelectFullBalance={handleSelectFullBalance}
              childPayoutReadout={childPayoutReadout}
              claimError={claimError}
              canClaim={canClaim}
              onClaimCashReward={handleClaimCashReward}
            />
          </div>
        </section>
      </div>

      <ChangeParentPinModal
        isOpen={changePinModalOpen}
        copy={copy.changePin}
        parentEmail={simulatedParentEmail}
        onClose={() => setChangePinModalOpen(false)}
      />

      <ParentPinGate
        mode={pinModalMode}
        isOpen={pinModalOpen}
        title={
          pinModalMode === "setup"
            ? copy.parentMode.setupTitle
            : copy.parentMode.pinTitle
        }
        body={
          pinModalMode === "setup"
            ? copy.parentMode.setupBody
            : copy.parentMode.pinBody
        }
        placeholder={copy.parentMode.pinPlaceholder}
        newPinLabel={copy.parentMode.setupNewLabel}
        confirmPlaceholder={copy.parentMode.setupConfirmLabel}
        confirmLabel={
          pinModalMode === "setup"
            ? copy.parentMode.setupSave
            : copy.parentMode.pinConfirm
        }
        cancelLabel={copy.parentMode.pinCancel}
        error={pinError}
        pinValue={pinInput}
        confirmPinValue={pinConfirmInput}
        onPinChange={setPinInput}
        onConfirmPinChange={setPinConfirmInput}
        onConfirm={handlePinConfirm}
        onCancel={handlePinCancel}
      />

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
