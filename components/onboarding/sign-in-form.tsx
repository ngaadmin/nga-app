"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { copyMatrix } from "@/constants/copyMatrix";
import {
  DASHBOARD_ACADEMY_PATH,
  hasCompletedPersonalizationGate,
  ONBOARDING_ENTRY_PATH,
  ONBOARDING_START_PATH,
  readUserSession,
  saveUserSession,
} from "@/lib/onboarding/guest-session";
import {
  authenticateRegisteredAccount,
  recoverCredentialByEmail,
  recoverUsernameByEmail,
} from "@/lib/onboarding/registered-accounts";
import { dispatchUserSessionUpdated } from "@/lib/onboarding/user-session-events";
import { cn } from "@/lib/utils/cn";

const fieldBase =
  "w-full rounded-nga-lg border-2 border-[#E5E5E5] bg-[#F7F7F7] px-4 py-3 font-sans text-base text-nga-ink transition-colors placeholder:text-nga-slate/60 focus:border-nga-secondary focus:bg-white focus:outline-none";

type FormErrors = {
  identifier?: string;
  credential?: string;
  recoveryEmail?: string;
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
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    if (hasCompletedPersonalizationGate(readUserSession())) {
      router.replace(DASHBOARD_ACADEMY_PATH);
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
  }

  function closeRecovery() {
    setRecoveryMode(null);
    setRecoveryNotice(null);
    setIsRecovering(false);
    setErrors((prev) => ({ ...prev, recoveryEmail: undefined, form: undefined }));
  }

  async function handleRecoverySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecoveryNotice(null);
    setIsRecovering(true);

    const result =
      recoveryMode === "username"
        ? await recoverUsernameByEmail(recoveryEmail)
        : await recoverCredentialByEmail(recoveryEmail);

    setIsRecovering(false);

    if (!result.accepted) {
      setErrors({ recoveryEmail: result.error });
      return;
    }

    setRecoveryNotice(
      recoveryMode === "username"
        ? copy.recoveryUsernameSuccess
        : "If that email is on file, we sent a reset code there. Use it to log in, then set a new password.",
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next: FormErrors = {};
    const trimmedIdentifier = identifier.trim();
    const trimmedCredential = credential.trim();

    if (!trimmedIdentifier) {
      next.identifier = "Enter your username or email.";
    }
    if (!trimmedCredential) {
      next.credential = "Enter your password.";
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    const session = authenticateRegisteredAccount(
      trimmedIdentifier,
      trimmedCredential,
    );

    if (!session) {
      setErrors({
        form: "Those details don't match a saved profile on this device. Try again, or jump back in with the free app.",
      });
      return;
    }

    saveUserSession(session);
    dispatchUserSessionUpdated();
    router.push(DASHBOARD_ACADEMY_PATH);
  }

  return (
    <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md space-y-8 px-1">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
            Log Back In
          </h1>
          <p className="font-sans text-sm leading-relaxed text-nga-slate sm:text-base">
            Welcome back - pick up your streak, badges, and money skills.
          </p>
        </div>

        {recoveryMode ? (
          <form className="space-y-6" onSubmit={handleRecoverySubmit} noValidate>
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="font-heading text-xl font-extrabold text-nga-primary">
                {recoveryMode === "username"
                  ? copy.forgotUsername
                  : "Forgot Password?"}
              </h2>
              <p className="font-sans text-sm leading-relaxed text-nga-slate">
                {recoveryMode === "username"
                  ? copy.recoveryUsernameHint
                  : "We'll email a temporary password reset code to this address."}
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
              onClick={closeRecovery}
              className="w-full rounded-nga-lg px-4 py-2 font-heading text-sm font-bold text-nga-secondary transition-colors hover:bg-nga-mist/40"
            >
              {copy.recoveryCancel}
            </button>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <label
                htmlFor="sign-in-identifier"
                className="block font-heading text-sm font-bold text-nga-primary"
              >
                Username or email
              </label>
              <input
                id="sign-in-identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                placeholder="Your username or email"
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
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => openRecovery("credential")}
                  className="shrink-0 font-heading text-xs font-bold text-nga-secondary underline-offset-2 hover:underline"
                >
                  Forgot Password?
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

            <div className="text-right">
              <button
                type="button"
                onClick={() => openRecovery("username")}
                className="font-heading text-xs font-bold text-nga-secondary underline-offset-2 hover:underline"
              >
                {copy.forgotUsername}
              </button>
            </div>

            {errors.form ? (
              <p
                className="font-sans text-sm font-medium text-red-600"
                role="alert"
              >
                {errors.form}
              </p>
            ) : null}

            <Button type="submit" variant="cta" fullWidth>
              Log Back In
            </Button>
          </form>
        )}

        <p className="text-center font-sans text-sm text-nga-slate">
          New here?{" "}
          <Link
            href={`${ONBOARDING_START_PATH}?fresh=1`}
            className="font-heading font-bold text-nga-secondary underline-offset-2 hover:underline"
          >
            Create a free account
          </Link>
          {" · "}
          <Link
            href={ONBOARDING_ENTRY_PATH}
            className="font-heading font-bold text-nga-secondary underline-offset-2 hover:underline"
          >
            Back to welcome
          </Link>
        </p>
      </div>
    </section>
  );
}
