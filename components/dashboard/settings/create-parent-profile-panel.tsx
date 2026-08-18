"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { copyMatrix } from "@/constants/copyMatrix";
import { createParentMasterAccount } from "@/lib/onboarding/create-parent-master";
import {
  convertToRegisteredProfile,
  DASHBOARD_SETTINGS_ACCOUNT_PATH,
  readUserSession,
} from "@/lib/onboarding/guest-session";
import { finalizeRegisteredSignup } from "@/lib/onboarding/signup-finalize";
import { cn } from "@/lib/utils/cn";
import { EMAIL_PATTERN } from "@/lib/validation/email";

const floatingPanelClass = "rounded-2xl border-0 bg-white shadow-md";
const fieldBase =
  "w-full rounded-nga-lg border-2 border-[#E5E5E5] bg-[#F7F7F7] px-4 py-3 font-sans text-base text-nga-ink transition-colors placeholder:text-nga-slate/60 focus:border-nga-secondary focus:bg-white focus:outline-none";

type FormErrors = {
  password?: string;
  confirmPassword?: string;
  email?: string;
  form?: string;
};

function adultBirthYear(): number {
  return new Date().getFullYear() - 35;
}

function prefillEmail(): string {
  const session = readUserSession();
  if (!session) return "";
  if (session.accountRole === "parent_master") {
    return (
      session.learnerEmail ??
      session.email ??
      session.parentEmail ??
      ""
    ).trim();
  }
  return (session.parentEmail ?? "").trim();
}

type CreateParentProfilePanelProps = {
  backHref?: string;
};

export function CreateParentProfilePanel({
  backHref = DASHBOARD_SETTINGS_ACCOUNT_PATH,
}: CreateParentProfilePanelProps) {
  const router = useRouter();
  const copy = copyMatrix.dashboard.settings.accountSubscription;
  const existingEmail = useMemo(() => prefillEmail(), []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState(existingEmail);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitInFlightRef = useRef(false);

  function clearError(key: keyof FormErrors) {
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function validate(): boolean {
    const next: FormErrors = {};
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      next.email = "Enter your email so we can save this parent profile.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      next.email = "Please enter a valid email address (e.g. name@example.com).";
    }

    if (!password) {
      next.password = "Create a password to secure your parent profile.";
    } else if (password.trim().length < 6) {
      next.password = "Use at least 6 characters for your password.";
    }

    if (!confirmPassword) {
      next.confirmPassword = "Confirm the password.";
    } else if (password && confirmPassword !== password) {
      next.confirmPassword = "Passwords don't match.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;
    if (submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    setIsSubmitting(true);

    try {
      const result = await createParentMasterAccount({
        password: password.trim(),
        email: email.trim(),
      });

      if (!result.success) {
        submitInFlightRef.current = false;
        setIsSubmitting(false);
        setErrors({ form: result.error });
        return;
      }

      const parentSession = convertToRegisteredProfile({
        username: result.parentUsername,
        birthYear: adultBirthYear(),
        accountRole: "parent_master",
        curriculumCohort: "maverick",
        learnerEmail: result.parentEmail,
        parentEmail: result.parentEmail,
        password: password.trim(),
        accountStatus: "ACTIVE",
        consentApprovedAt: new Date().toISOString(),
        supabaseUserId: result.parentId,
      });
      await finalizeRegisteredSignup(parentSession);
      router.replace(DASHBOARD_SETTINGS_ACCOUNT_PATH);
    } catch (error) {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
      setErrors({
        form:
          error instanceof Error && error.message.trim()
            ? error.message.trim()
            : "We could not create your parent profile. Check the details and try again.",
      });
    }
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-6 overflow-x-hidden bg-white px-2 py-4 pb-8">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="font-heading text-sm font-bold text-[#0CC1E0] transition-colors hover:text-[#031F82]"
        >
          ← {copy.addLinkedBackAccounts}
        </button>
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold text-[#031F82]">
            {copy.createParentTitle}
          </h1>
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            {copy.createParentHint}
          </p>
        </div>
      </div>

      <form
        className={cn(floatingPanelClass, "space-y-4 p-4")}
        onSubmit={handleSubmit}
        noValidate
      >
        <p className="font-sans text-sm font-semibold leading-relaxed text-[#031F82]">
          {copy.needParentPrompt}
        </p>

        <div className="space-y-2">
          <label
            htmlFor="parent-email"
            className="block font-heading text-sm font-bold text-nga-primary"
          >
            {copy.createParentEmailLabel}
          </label>
          <input
            id="parent-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="parent@example.com"
            value={email}
            readOnly={Boolean(existingEmail)}
            onChange={(e) => {
              if (existingEmail) return;
              setEmail(e.target.value);
              clearError("email");
            }}
            aria-invalid={Boolean(errors.email)}
            className={cn(
              fieldBase,
              existingEmail && "bg-nga-mist/40",
              errors.email && "border-red-400 focus:border-red-500",
            )}
          />
          <p className="font-sans text-sm italic leading-relaxed text-nga-slate">
            {copy.createParentEmailHint}
          </p>
          {errors.email ? (
            <p className="font-sans text-sm font-medium text-red-600" role="alert">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="parent-password"
            className="block font-heading text-sm font-bold text-nga-primary"
          >
            {copy.createParentPasswordLabel}
          </label>
          <input
            id="parent-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError("password");
            }}
            aria-invalid={Boolean(errors.password)}
            className={cn(
              fieldBase,
              errors.password && "border-red-400 focus:border-red-500",
            )}
          />
          {errors.password ? (
            <p className="font-sans text-sm font-medium text-red-600" role="alert">
              {errors.password}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="parent-confirm-password"
            className="block font-heading text-sm font-bold text-nga-primary"
          >
            {copy.createParentConfirmPasswordLabel}
          </label>
          <input
            id="parent-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter the password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clearError("confirmPassword");
            }}
            aria-invalid={Boolean(errors.confirmPassword)}
            className={cn(
              fieldBase,
              errors.confirmPassword && "border-red-400 focus:border-red-500",
            )}
          />
          {errors.confirmPassword ? (
            <p className="font-sans text-sm font-medium text-red-600" role="alert">
              {errors.confirmPassword}
            </p>
          ) : null}
        </div>

        {errors.form ? (
          <p className="font-sans text-sm font-medium text-red-600" role="alert">
            {errors.form}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="cta"
          fullWidth
          disabled={isSubmitting}
          aria-busy={isSubmitting || undefined}
        >
          {isSubmitting ? copy.createParentSubmitting : copy.createParentSubmit}
        </Button>
      </form>
    </div>
  );
}
