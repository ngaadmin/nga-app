"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ONBOARDING_SIGN_IN_PATH } from "@/lib/onboarding/guest-session";
import { setRegisteredAccountPassword } from "@/lib/onboarding/registered-accounts";
import { cn } from "@/lib/utils/cn";

const fieldBase =
  "w-full rounded-nga-lg border-2 border-[#E5E5E5] bg-[#F7F7F7] px-4 py-3 font-sans text-base text-nga-ink transition-colors placeholder:text-nga-slate/60 focus:border-nga-secondary focus:bg-white focus:outline-none";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") ?? "").trim();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);

  const lookupError = token
    ? null
    : "This reset link is invalid or expired. Request a new one from Log in.";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const next: { newPassword?: string; confirmPassword?: string } = {};
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
      setFieldError(next);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: trimmedNew }),
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      });
      const json = (await response.json().catch(() => null)) as
        | { ok?: boolean; username?: string; error?: string }
        | null;

      if (!json?.ok || typeof json.username !== "string") {
        setFormError(
          typeof json?.error === "string" && json.error.trim()
            ? json.error.trim()
            : "We could not update this password. Try again.",
        );
        return;
      }

      setRegisteredAccountPassword(json.username, trimmedNew);
      router.replace(ONBOARDING_SIGN_IN_PATH);
    } catch {
      setFormError("We could not update this password. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md space-y-8 px-1">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
            Set a new password
          </h1>
          <p className="font-sans text-sm leading-relaxed text-nga-slate sm:text-base">
            Choose a new password for this login. Other accounts stay the same.
          </p>
        </div>

        {lookupError ? (
          <div className="space-y-4 text-center">
            <p className="font-sans text-sm font-medium text-red-600" role="alert">
              {lookupError}
            </p>
            <Link
              href={ONBOARDING_SIGN_IN_PATH}
              className="font-heading font-bold text-nga-secondary underline-offset-2 hover:underline"
            >
              Back to log in
            </Link>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <label
                htmlFor="reset-new-password"
                className="block font-heading text-sm font-bold text-nga-primary"
              >
                New password
              </label>
              <input
                id="reset-new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setFieldError((prev) => ({ ...prev, newPassword: undefined }));
                  setFormError(null);
                }}
                aria-invalid={Boolean(fieldError.newPassword)}
                className={cn(
                  fieldBase,
                  fieldError.newPassword && "border-red-400 focus:border-red-500",
                )}
              />
              {fieldError.newPassword ? (
                <p className="font-sans text-sm font-medium text-red-600" role="alert">
                  {fieldError.newPassword}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="reset-confirm-password"
                className="block font-heading text-sm font-bold text-nga-primary"
              >
                Confirm new password
              </label>
              <input
                id="reset-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setFieldError((prev) => ({
                    ...prev,
                    confirmPassword: undefined,
                  }));
                  setFormError(null);
                }}
                aria-invalid={Boolean(fieldError.confirmPassword)}
                className={cn(
                  fieldBase,
                  fieldError.confirmPassword &&
                    "border-red-400 focus:border-red-500",
                )}
              />
              {fieldError.confirmPassword ? (
                <p className="font-sans text-sm font-medium text-red-600" role="alert">
                  {fieldError.confirmPassword}
                </p>
              ) : null}
            </div>

            {formError ? (
              <p className="font-sans text-sm font-medium text-red-600" role="alert">
                {formError}
              </p>
            ) : null}

            <Button type="submit" variant="cta" fullWidth disabled={isSaving}>
              {isSaving ? "Saving…" : "Save new password"}
            </Button>
          </form>
        )}

        {!lookupError ? (
          <p className="text-center font-sans text-sm text-nga-slate">
            <Link
              href={ONBOARDING_SIGN_IN_PATH}
              className="font-heading font-bold text-nga-secondary underline-offset-2 hover:underline"
            >
              Back to log in
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
