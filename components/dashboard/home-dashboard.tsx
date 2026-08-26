"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { ModalShell } from "@/components/ui/modal-shell";
import { ParentHubSection } from "@/components/dashboard/settings/parent-hub-section";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import type { SupportedCurrencyCode } from "@/lib/dashboard/currency/currencies";
import { signOutApp } from "@/lib/onboarding/sign-out";
import {
  ONBOARDING_ENTRY_PATH,
  readUserSession,
} from "@/lib/onboarding/guest-session";
import {
  recoverCredentialByEmail,
  resolveHouseholdEmail,
} from "@/lib/onboarding/registered-accounts";
import {
  BillingCardIcon,
  CommunityIcon,
  GoldCoinIcon,
  KeyIcon,
  LockIcon,
  LogOutIcon,
} from "@/lib/dashboard/icons";
import {
  dispatchParentPinRecoveryEmail,
  isParentPinConfigured,
  isValidPinFormat,
  issueParentPinRecovery,
  resolveSimulatedParentEmail,
  saveParentPin,
  verifyParentPin,
} from "@/lib/dashboard/parent-pin";
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
  busy?: boolean;
  disabled?: boolean;
};

function SettingsRow({
  icon: Icon,
  label,
  onClick,
  busy = false,
  disabled = false,
}: SettingsRowProps) {
  const isDisabled = disabled || busy;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={busy || undefined}
      className={cn(
        "flex w-full items-center gap-3 py-3.5 text-left transition-colors",
        isDisabled
          ? "cursor-not-allowed bg-[#BDE9FB]/25 opacity-70"
          : "hover:bg-[#BDE9FB]/15 active:bg-[#BDE9FB]/25",
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#BDE9FB]/35 text-[#0CC1E0]">
        <Icon className="size-4" />
      </span>
      <span className="font-heading text-[16px] font-bold text-[#031F82]">
        {label}
      </span>
    </button>
  );
}

function SettingsCurrencyRow() {
  const copy = copyMatrix.dashboard.settings.currency;
  const { currencyCode, supportedCurrencies, setCurrencyCode } = useCurrency();

  return (
    <div className="flex w-full items-center gap-3 py-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#BDE9FB]/35 text-[#0CC1E0]">
        <GoldCoinIcon className="size-4" />
      </span>
      <label
        htmlFor="display-currency"
        className="min-w-0 flex-1 font-heading text-[16px] font-bold text-[#031F82]"
      >
        {copy.heading}
      </label>
      <select
        id="display-currency"
        value={currencyCode}
        onChange={(event) => {
          setCurrencyCode(event.target.value as SupportedCurrencyCode);
        }}
        aria-label={copy.heading}
        className="min-w-0 max-w-[8.5rem] shrink-0 rounded-xl border-0 bg-[#BDE9FB]/35 px-2 py-1.5 font-heading text-sm font-bold text-[#031F82] outline-none focus:ring-2 focus:ring-[#0CC1E0]"
      >
        {supportedCurrencies.map((entry) => (
          <option key={entry.code} value={entry.code}>
            {entry.flag} {entry.code}
          </option>
        ))}
      </select>
    </div>
  );
}

type ProfileHeaderProps = {
  username: string;
  email?: string | null;
  joinDateLabel: string;
  joinDate: string | null;
  isLoading: boolean;
};

function ProfileHeader({
  username,
  email,
  joinDateLabel,
  joinDate,
  isLoading,
}: ProfileHeaderProps) {
  const initial = username.trim().charAt(0).toUpperCase() || "?";
  const showEmail =
    Boolean(email?.trim()) &&
    email!.trim().toLowerCase() !== username.trim().toLowerCase();

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
        {showEmail ? (
          <p className="mt-0.5 truncate font-sans text-[14px] text-[#1E3A5F]">
            {email}
          </p>
        ) : null}
        <p className="mt-1 font-sans text-[14px] text-[#1E3A5F]/75">
          {joinDateLabel} {formatJoinDate(joinDate)}
        </p>
      </div>
    </header>
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
      <span className="font-heading text-sm font-bold text-[#031F82]">
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
      const recoveryCode = issueParentPinRecovery();
      const result = await dispatchParentPinRecoveryEmail(
        parentEmail,
        recoveryCode,
      );
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
          <p className="mt-3 font-sans text-sm font-semibold text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {recoveryNotice ? (
          <p className="mt-3 rounded-xl bg-[#BDE9FB]/35 px-3 py-2 font-sans text-sm leading-relaxed text-[#031F82]">
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

const resetEmailFieldClass =
  "w-full rounded-xl border-2 border-[#BDE9FB] bg-[#F7FBFF] px-4 py-2.5 font-sans text-sm text-[#031F82] outline-none focus:border-[#0CC1E0]";

type PasswordResetModalProps = {
  isOpen: boolean;
  copy: (typeof copyMatrix.dashboard.settings)["account"];
  onClose: () => void;
};

function PasswordResetModal({ isOpen, copy, onClose }: PasswordResetModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const session = isOpen ? readUserSession() : null;
  const knownEmail = session ? resolveHouseholdEmail(session) : null;
  const isParent = session?.accountRole === "parent_master";
  const isChild = session?.accountRole === "child";
  const missingEmail =
    session?.accessMode === "registered" && (isParent || isChild) && !knownEmail;

  useEffect(() => {
    if (!isOpen) return;
    setEmail(knownEmail ?? "");
    setError(null);
    setNotice(null);
    setIsSending(false);
  }, [isOpen, knownEmail]);

  function handleClose() {
    setEmail("");
    setError(null);
    setNotice(null);
    setIsSending(false);
    onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (missingEmail) return;
    setError(null);
    setNotice(null);
    setIsSending(true);

    const result = await recoverCredentialByEmail(email, {
      onlyUsername:
        isChild && session?.username ? session.username : undefined,
    });

    setIsSending(false);

    if (!result.accepted) {
      setError(result.error);
      return;
    }

    setNotice(copy.passwordResetSuccess);
  }

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      layer="toast"
      labelledBy="password-reset-title"
      backdropClassName="bg-[#031F82]/55"
      panelClassName="rounded-2xl border-0 bg-white p-5 shadow-md"
    >
      <h2
        id="password-reset-title"
        className="font-heading text-lg font-extrabold text-[#031F82]"
      >
        {copy.passwordResetTitle}
      </h2>
      <p className="mt-2 font-sans text-sm leading-relaxed text-[#1E3A5F]">
        {isChild ? copy.passwordResetChildHint : copy.passwordResetParentHint}
      </p>

      {missingEmail ? (
        <p className="mt-3 font-sans text-sm font-semibold text-[#031F82]" role="status">
          {copy.passwordResetNeedEmail}
        </p>
      ) : (
        <form className="mt-4 space-y-3" onSubmit={handleSubmit} noValidate>
          <label htmlFor="settings-reset-email" className="block space-y-1.5">
            <span className="font-heading text-sm font-bold text-[#031F82]">
              Parent email
            </span>
            <input
              id="settings-reset-email"
              name="resetEmail"
              type="email"
              autoComplete="email"
              value={email}
              readOnly={Boolean(knownEmail)}
              onChange={(event) => {
                if (knownEmail) return;
                setEmail(event.target.value);
                setError(null);
                setNotice(null);
              }}
              className={cn(
                resetEmailFieldClass,
                knownEmail && "bg-[#F7FBFF]/70",
              )}
            />
          </label>

          {error ? (
            <p className="font-sans text-sm font-semibold text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          {notice ? (
            <p className="rounded-xl bg-[#BDE9FB]/35 px-3 py-2 font-sans text-sm leading-relaxed text-[#031F82]">
              {notice}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSending || !email.trim()}
            className={cn("h-touch w-full px-6 shadow-md", orangeCtaClass)}
          >
            {isSending ? copy.passwordResetSending : copy.passwordResetSubmit}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={handleClose}
        className="mt-3 w-full rounded-nga-lg px-4 py-2 font-heading text-sm font-bold text-[#0CC1E0] transition-colors hover:bg-[#BDE9FB]/60"
      >
        {copy.passwordResetCancel}
      </button>
    </ModalShell>
  );
}

export function HomeDashboard() {
  const router = useRouter();
  const { username, email, joinDate, isLoading } = useDashboardUser();
  const copy = copyMatrix.dashboard.settings;

  const [changePinModalOpen, setChangePinModalOpen] = useState(false);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const loggingOutRef = useRef(false);

  const simulatedParentEmail = useMemo(
    () => email ?? resolveSimulatedParentEmail(username),
    [email, username],
  );

  async function handleLogOut() {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setIsLoggingOut(true);

    try {
      await signOutApp();
      router.replace(ONBOARDING_ENTRY_PATH);
      router.refresh();
    } catch {
      loggingOutRef.current = false;
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-6 overflow-x-hidden bg-white px-2 py-4 pb-8">
        <ProfileHeader
          username={username}
          email={email}
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
            onClick={() => setPasswordResetOpen(true)}
          />
          <SettingsRow
            icon={LockIcon}
            label={copy.account.changeParentPin}
            onClick={() => setChangePinModalOpen(true)}
          />
          <SettingsRow
            icon={CommunityIcon}
            label={copy.account.accounts}
            onClick={() => router.push("/dashboard/settings/account")}
          />
          <SettingsRow
            icon={BillingCardIcon}
            label={copy.account.subscription}
            onClick={() => router.push("/dashboard/settings/subscription")}
          />
          <SettingsCurrencyRow />
          <SettingsRow
            icon={LogOutIcon}
            label={isLoggingOut ? "Signing out…" : copy.account.logOut}
            onClick={() => {
              void handleLogOut();
            }}
            busy={isLoggingOut}
          />
        </nav>

        <ParentHubSection />
      </div>

      <PasswordResetModal
        isOpen={passwordResetOpen}
        copy={copy.account}
        onClose={() => setPasswordResetOpen(false)}
      />

      <ChangeParentPinModal
        isOpen={changePinModalOpen}
        copy={copy.changePin}
        parentEmail={simulatedParentEmail}
        onClose={() => setChangePinModalOpen(false)}
      />
    </>
  );
}
