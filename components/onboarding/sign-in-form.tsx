"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { copyMatrix } from "@/constants/copyMatrix";
import { registeredPlayPath } from "@/lib/onboarding/explorer-pending-consent";
import {
  ONBOARDING_SIGN_UP_PATH,
  readUserSession,
  saveUserSession,
} from "@/lib/onboarding/guest-session";
import { updateSignedInPassword } from "@/lib/onboarding/learner-account";
import {
  findRegisteredAccountByUsername,
  findRegisteredAccountsByEmail,
  recoverPassword,
  recoverUsernameByEmail,
  setRegisteredAccountPassword,
} from "@/lib/onboarding/registered-accounts";
import { applyLearnerAccountSnapshot } from "@/lib/onboarding/sync-registered-session";
import { finalizeRegisteredSignup } from "@/lib/onboarding/signup-finalize";
import { restoreRegisteredAccountProgress } from "@/lib/dashboard/account-progress-sync";
import { dispatchUserSessionUpdated } from "@/lib/onboarding/user-session-events";
import { cn } from "@/lib/utils/cn";

const fieldBase =
  "w-full rounded-nga-lg border-2 border-[#E5E5E5] bg-[#F7F7F7] px-4 py-3 font-sans text-base text-nga-ink transition-colors placeholder:text-nga-slate/60 focus:border-nga-secondary focus:bg-white focus:outline-none";

type FormErrors = {
  identifier?: string;
  credential?: string;
  recoveryEmail?: string;
  recoveryUsername?: string;
  newPassword?: string;
  confirmPassword?: string;
  form?: string;
};

type RecoveryMode = "username" | "credential" | null;

export function SignInForm() {
  const router = useRouter();
  const copy = copyMatrix.onboarding.signIn;
  const [identifier, setIdentifier] = useState("");
  const [credential, setCredential] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [recoveryMode, setRecoveryMode] = useState<RecoveryMode>(null);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryUsername, setRecoveryUsername] = useState("");
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [pendingUsername, setPendingUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    const session = readUserSession();
    if (session?.mustChangePassword) {
      setForcePasswordChange(true);
      setPendingUsername(session.username);
      return;
    }
    if (
      session?.accessMode === "registered" &&
      !session.mustChangePassword
    ) {
      router.replace(registeredPlayPath(session));
    }
  }, [router]);

  function clearError(key: keyof FormErrors) {
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function openRecovery(mode: Exclude<RecoveryMode, null>) {
    setRecoveryMode(mode);
    setRecoveryNotice(null);
    setErrors({});
    const looksLikeEmail = identifier.includes("@");
    setRecoveryEmail(looksLikeEmail ? identifier.trim() : "");
    setRecoveryUsername(looksLikeEmail ? "" : identifier.trim());
  }

  function closeRecovery() {
    setRecoveryMode(null);
    setRecoveryNotice(null);
    setIsRecovering(false);
    setErrors((prev) => ({
      ...prev,
      recoveryEmail: undefined,
      recoveryUsername: undefined,
      form: undefined,
    }));
  }

  async function handleRecoverySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecoveryNotice(null);

    if (
      recoveryMode === "credential" &&
      !recoveryEmail.trim() &&
      !recoveryUsername.trim()
    ) {
      setErrors({ recoveryEmail: copy.recoveryNeedAccount });
      return;
    }

    setIsRecovering(true);

    try {
      const result =
        recoveryMode === "username"
          ? await recoverUsernameByEmail(recoveryEmail)
          : await recoverPassword({
              email: recoveryEmail,
              username: recoveryUsername,
            });

      if (!result.accepted) {
        setErrors({ recoveryEmail: result.error });
        return;
      }

      if (recoveryMode === "credential") {
        closeRecovery();
        return;
      }

      setRecoveryNotice(copy.recoveryUsernameSuccess);
    } catch {
      setErrors({
        recoveryEmail:
          "Could not send a recovery email. Try again shortly.",
      });
    } finally {
      setIsRecovering(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsSigningIn(true);
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const trimmedIdentifier = (
      (typeof formData.get("identifier") === "string"
        ? (formData.get("identifier") as string)
        : identifier) || ""
    ).trim();
    const trimmedCredential = (
      (typeof formData.get("credential") === "string"
        ? (formData.get("credential") as string)
        : credential) || ""
    ).trim();

    const next: FormErrors = {};
    if (!trimmedIdentifier) {
      next.identifier = "Enter your email or username.";
    }
    if (!trimmedCredential) {
      next.credential = "Enter your password.";
    }

    if (Object.keys(next).length > 0) {
      setErrors({
        ...next,
        form: "Enter your email or username and password.",
      });
      setIsSigningIn(false);
      return;
    }

    if (trimmedIdentifier !== identifier) {
      setIdentifier(trimmedIdentifier);
    }
    if (trimmedCredential !== credential) {
      setCredential(trimmedCredential);
    }
    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: trimmedIdentifier,
          password: trimmedCredential,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      });
      const remote = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            account?: Parameters<typeof applyLearnerAccountSnapshot>[0];
            error?: string;
          }
        | null;

      if (!remote?.success || !remote.account) {
        setErrors({
          form:
            typeof remote?.error === "string" && remote.error.trim()
              ? remote.error.trim()
              : copy.credentialsMismatch,
        });
        return;
      }

      const existing =
        findRegisteredAccountByUsername(remote.account.username) ??
        findRegisteredAccountByUsername(trimmedIdentifier) ??
        findRegisteredAccountsByEmail(trimmedIdentifier)[0] ??
        readUserSession();

      try {
        const session = applyLearnerAccountSnapshot(remote.account, {
          existing,
          password: trimmedCredential,
        });
        await finalizeRegisteredSignup(session, { skipEmail: true });
        await restoreRegisteredAccountProgress({
          userId: remote.account.userId,
          username: remote.account.username,
        });
        dispatchUserSessionUpdated();

        if (session.mustChangePassword) {
          setPendingUsername(session.username);
          setForcePasswordChange(true);
          setNewPassword("");
          setConfirmPassword("");
          setErrors({});
          return;
        }

        router.push(registeredPlayPath(session));
      } catch (error) {
        console.error("[sign-in] Profile apply failed", {
          message: error instanceof Error ? error.message : "unknown",
        });
        setErrors({ form: copy.profileOpenFailed });
      }
    } catch {
      setErrors({ form: copy.signInUnavailable });
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handlePasswordChangeSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    const next: FormErrors = {};
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedNew) {
      next.newPassword = "Enter a new password.";
    } else if (trimmedNew.length < 6) {
      next.newPassword = "Use at least 6 characters for your password.";
    }
    if (!trimmedConfirm) {
      next.confirmPassword = "Confirm your new password.";
    } else if (trimmedNew && trimmedConfirm !== trimmedNew) {
      next.confirmPassword = "Passwords don't match.";
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const current = readUserSession();
      if (current?.supabaseUserId) {
        const remote = await updateSignedInPassword(trimmedNew);
        if (!remote.ok) {
          setErrors({
            form: remote.error || "We could not update your password. Try again.",
          });
          return;
        }
      }

      const updated = setRegisteredAccountPassword(pendingUsername, trimmedNew);
      if (!updated) {
        setErrors({
          form: "We could not update your password. Try signing in again.",
        });
        return;
      }

      saveUserSession(updated);
      dispatchUserSessionUpdated();
      router.push(registeredPlayPath(updated));
    } catch {
      setErrors({
        form: "We could not update your password. Try again.",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  return (
    <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md space-y-8 px-1">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
            {forcePasswordChange ? "Set a new password" : copy.title}
          </h1>
          {forcePasswordChange ? (
            <p className="font-sans text-sm leading-relaxed text-nga-slate sm:text-base">
              You signed in with a temporary password. Choose a new one to
              continue.
            </p>
          ) : null}
        </div>

        {forcePasswordChange ? (
          <form
            className="space-y-6"
            onSubmit={handlePasswordChangeSubmit}
            noValidate
          >
            <div className="space-y-2">
              <label
                htmlFor="new-password"
                className="block font-heading text-sm font-bold text-nga-primary"
              >
                New password
              </label>
              <input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  clearError("newPassword");
                  clearError("form");
                }}
                aria-invalid={Boolean(errors.newPassword)}
                className={cn(
                  fieldBase,
                  errors.newPassword && "border-red-400 focus:border-red-500",
                )}
              />
              {errors.newPassword ? (
                <p
                  className="font-sans text-sm font-medium text-red-600"
                  role="alert"
                >
                  {errors.newPassword}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirm-password"
                className="block font-heading text-sm font-bold text-nga-primary"
              >
                Confirm new password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearError("confirmPassword");
                  clearError("form");
                }}
                aria-invalid={Boolean(errors.confirmPassword)}
                className={cn(
                  fieldBase,
                  errors.confirmPassword &&
                    "border-red-400 focus:border-red-500",
                )}
              />
              {errors.confirmPassword ? (
                <p
                  className="font-sans text-sm font-medium text-red-600"
                  role="alert"
                >
                  {errors.confirmPassword}
                </p>
              ) : null}
            </div>

            {errors.form ? (
              <p
                className="font-sans text-sm font-medium text-red-600"
                role="alert"
              >
                {errors.form}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="cta"
              fullWidth
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? "Saving…" : "Save new password"}
            </Button>
          </form>
        ) : recoveryMode ? (
          <form className="space-y-6" onSubmit={handleRecoverySubmit} noValidate>
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="font-heading text-xl font-extrabold text-nga-primary">
                {recoveryMode === "username"
                  ? copy.forgotUsername
                  : copy.forgotPassword}
              </h2>
              <p className="font-sans text-sm leading-relaxed text-nga-slate">
                {recoveryMode === "username"
                  ? copy.recoveryUsernameHint
                  : copy.recoveryPasswordHint}
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="recovery-email"
                className="block font-heading text-sm font-bold text-nga-primary"
              >
                {copy.recoveryEmailLabel}
              </label>
              <input
                id="recovery-email"
                name="recoveryEmail"
                type="email"
                autoComplete="email"
                placeholder={copy.recoveryEmailPlaceholder}
                value={recoveryEmail}
                onChange={(e) => {
                  setRecoveryEmail(e.target.value);
                  clearError("recoveryEmail");
                  setRecoveryNotice(null);
                }}
                aria-invalid={Boolean(errors.recoveryEmail)}
                className={cn(
                  fieldBase,
                  errors.recoveryEmail && "border-red-400 focus:border-red-500",
                )}
              />
              {errors.recoveryEmail ? (
                <p
                  className="font-sans text-sm font-medium text-red-600"
                  role="alert"
                >
                  {errors.recoveryEmail}
                </p>
              ) : null}
            </div>

            {recoveryMode === "credential" ? (
              <div className="space-y-2">
                <label
                  htmlFor="recovery-username"
                  className="block font-heading text-sm font-bold text-nga-primary"
                >
                  {copy.recoveryLoginUsernameLabel}
                </label>
                <input
                  id="recovery-username"
                  name="recoveryUsername"
                  type="text"
                  autoComplete="username"
                  placeholder={copy.recoveryLoginUsernamePlaceholder}
                  value={recoveryUsername}
                  onChange={(e) => {
                    setRecoveryUsername(e.target.value);
                    clearError("recoveryUsername");
                    clearError("recoveryEmail");
                    setRecoveryNotice(null);
                  }}
                  aria-invalid={Boolean(errors.recoveryUsername)}
                  className={cn(
                    fieldBase,
                    errors.recoveryUsername &&
                      "border-red-400 focus:border-red-500",
                  )}
                />
              </div>
            ) : null}

            {recoveryNotice ? (
              <p
                className="font-sans text-sm font-medium text-nga-primary"
                role="status"
              >
                {recoveryNotice}
              </p>
            ) : null}

            <Button type="submit" variant="cta" fullWidth disabled={isRecovering}>
              {isRecovering
                ? copy.recoverySending
                : recoveryMode === "username"
                  ? copy.recoveryUsernameSubmit
                  : copy.recoveryCredentialSubmit}
            </Button>
            <button
              type="button"
              onClick={() => closeRecovery()}
              className="w-full rounded-nga-lg px-4 py-2 font-heading text-sm font-bold text-nga-secondary transition-colors hover:bg-nga-mist/40"
            >
              {copy.recoveryCancel}
            </button>
          </form>
        ) : (
          <form
            className="space-y-6"
            onSubmit={handleSubmit}
            noValidate
          >
            {errors.form ? (
              <p
                className="font-sans text-sm font-medium text-red-600"
                role="alert"
              >
                {errors.form}
              </p>
            ) : null}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="sign-in-identifier"
                  className="block font-heading text-sm font-bold text-nga-primary"
                >
                  {copy.identifierLabel}
                </label>
                <button
                  type="button"
                  onClick={() => openRecovery("username")}
                  className="shrink-0 font-heading text-xs font-bold text-nga-secondary underline-offset-2 hover:underline"
                >
                  {copy.forgotUsername}
                </button>
              </div>
              <input
                id="sign-in-identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                placeholder={copy.identifierPlaceholder}
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  clearError("identifier");
                  clearError("form");
                }}
                aria-invalid={Boolean(errors.identifier)}
                aria-describedby={
                  errors.identifier ? "sign-in-identifier-error" : undefined
                }
                className={cn(
                  fieldBase,
                  errors.identifier && "border-red-400 focus:border-red-500",
                )}
              />
              {errors.identifier ? (
                <p
                  id="sign-in-identifier-error"
                  className="font-sans text-sm font-medium text-red-600"
                  role="alert"
                >
                  {errors.identifier}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="sign-in-credential"
                  className="block font-heading text-sm font-bold text-nga-primary"
                >
                  {copy.passwordLabel}
                </label>
                <button
                  type="button"
                  onClick={() => openRecovery("credential")}
                  className="shrink-0 font-heading text-xs font-bold text-nga-secondary underline-offset-2 hover:underline"
                >
                  {copy.forgotPassword}
                </button>
              </div>
              <input
                id="sign-in-credential"
                name="credential"
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={credential}
                onChange={(e) => {
                  setCredential(e.target.value);
                  clearError("credential");
                  clearError("form");
                }}
                aria-invalid={Boolean(errors.credential)}
                aria-describedby={
                  errors.credential ? "sign-in-credential-error" : undefined
                }
                className={cn(
                  fieldBase,
                  errors.credential && "border-red-400 focus:border-red-500",
                )}
              />
              {errors.credential ? (
                <p
                  id="sign-in-credential-error"
                  className="font-sans text-sm font-medium text-red-600"
                  role="alert"
                >
                  {errors.credential}
                </p>
              ) : null}
            </div>

            {errors.form ? (
              <p
                className="font-sans text-sm font-medium text-red-600"
                role="alert"
              >
                {errors.form}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="cta"
              fullWidth
              disabled={isSigningIn}
            >
              {isSigningIn ? copy.signingIn : copy.submit}
            </Button>
          </form>
        )}

        {!forcePasswordChange ? (
          <p className="text-center font-sans text-sm text-nga-slate">
            {copy.noAccount}{" "}
            <Link
              href={`${ONBOARDING_SIGN_UP_PATH}?from=login`}
              className="font-heading font-bold text-nga-secondary underline-offset-2 hover:underline"
            >
              {copy.createAccount}
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
