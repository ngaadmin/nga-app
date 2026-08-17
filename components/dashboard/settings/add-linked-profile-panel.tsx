"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { copyMatrix } from "@/constants/copyMatrix";
import {
  MASTERY_COHORT_ORDER,
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import { representativeBirthYearForCohort } from "@/lib/onboarding/birth-years";
import { createSupabaseAccount } from "@/lib/onboarding/create-supabase-account";
import {
  convertToRegisteredProfile,
  DASHBOARD_SETTINGS_ACCOUNT_PATH,
  readUserSession,
} from "@/lib/onboarding/guest-session";
import { isInternalPlaceholderUsername } from "@/lib/onboarding/placeholder-username";
import {
  findRegisteredAccountByUsername,
  resolveHouseholdEmail,
  upsertRegisteredAccount,
} from "@/lib/onboarding/registered-accounts";
import { dispatchUserSessionUpdated } from "@/lib/onboarding/user-session-events";
import { cn } from "@/lib/utils/cn";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{2,20}$/;
const USERNAME_TAKEN_ERROR =
  "That username is already taken. Try adding a favorite number!";

const TRACK_AVATAR_SRC: Record<MasteryCohort, string> = {
  explorer: "/assets/illustrations/website/Avatars/Avatar_Explorer.webp",
  pathfinder: "/assets/illustrations/website/Avatars/Avatar_Pathfinder.webp",
  maverick: "/assets/illustrations/website/Avatars/Avatar_Maverick.webp",
};

const floatingPanelClass = "rounded-2xl border-0 bg-white shadow-md";
const fieldBase =
  "w-full rounded-nga-lg border-2 border-[#E5E5E5] bg-[#F7F7F7] px-4 py-3 font-sans text-base text-nga-ink transition-colors placeholder:text-nga-slate/60 focus:border-nga-secondary focus:bg-white focus:outline-none";

type FormErrors = {
  username?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
};

export function AddLinkedProfilePanel() {
  const router = useRouter();
  const copy = copyMatrix.dashboard.settings.accountSubscription;
  const parentSession = useMemo(() => readUserSession(), []);
  const householdEmail = parentSession
    ? resolveHouseholdEmail(parentSession)
    : null;

  const [step, setStep] = useState<"track" | "details">("track");
  const [cohort, setCohort] = useState<MasteryCohort | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitInFlightRef = useRef(false);

  const isParentMaster =
    parentSession?.accessMode === "registered" &&
    parentSession.accountRole === "parent_master";

  useEffect(() => {
    if (!isParentMaster) {
      router.replace(DASHBOARD_SETTINGS_ACCOUNT_PATH);
    }
  }, [isParentMaster, router]);

  function clearError(key: keyof FormErrors) {
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function validateDetails(): boolean {
    const next: FormErrors = {};
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      next.username = "Pick a username for this learner.";
    } else if (isInternalPlaceholderUsername(trimmedUsername)) {
      next.username = "Pick a username you choose yourself.";
    } else if (!USERNAME_PATTERN.test(trimmedUsername)) {
      next.username = "Use 2-20 letters, numbers, underscores, or hyphens only.";
    } else {
      const existingAccount = findRegisteredAccountByUsername(trimmedUsername);
      if (
        existingAccount &&
        existingAccount.accountStatus === "ACTIVE" &&
        existingAccount.accessMode === "registered"
      ) {
        next.username = USERNAME_TAKEN_ERROR;
      }
    }

    if (!password) {
      next.password = "Create a password to secure this account.";
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

  function handleContinueToDetails() {
    if (!cohort) return;
    setErrors({});
    setStep("details");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cohort || !validateDetails()) return;

    const parentId = parentSession?.supabaseUserId?.trim();
    if (!parentSession || !parentId) {
      setErrors({ form: copy.addLinkedNeedParent });
      return;
    }
    if (!householdEmail) {
      setErrors({ form: copy.addLinkedNeedEmail });
      return;
    }

    if (submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    setIsSubmitting(true);

    try {
      const result = await createSupabaseAccount({
        username: username.trim(),
        password: password.trim(),
        cohort,
        parentInitiatedById: parentId,
      });

      if (!result.success) {
        submitInFlightRef.current = false;
        setIsSubmitting(false);
        if (/username is already taken/i.test(result.error)) {
          setErrors({ username: USERNAME_TAKEN_ERROR });
          return;
        }
        setErrors({ form: result.error });
        return;
      }

      const now = new Date().toISOString();
      const childSession = convertToRegisteredProfile({
        username: result.username,
        birthYear: representativeBirthYearForCohort(cohort),
        accountRole: "child",
        parentEmail: householdEmail,
        password: password.trim(),
        accountStatus: "ACTIVE",
        consentApprovedAt: now,
        marketingOptIn: false,
        supabaseUserId: result.userId,
        curriculumCohort: cohort,
      });
      upsertRegisteredAccount({
        ...childSession,
        parentEmail: householdEmail,
        createdAt: now,
      });
      dispatchUserSessionUpdated();
      router.replace(DASHBOARD_SETTINGS_ACCOUNT_PATH);
    } catch (error) {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
      setErrors({
        form:
          error instanceof Error && error.message.trim()
            ? error.message.trim()
            : "We could not add this linked profile. Check the details and try again.",
      });
    }
  }

  if (!isParentMaster) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-6 overflow-x-hidden bg-white px-2 py-4 pb-8">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() =>
            step === "details"
              ? setStep("track")
              : router.push(DASHBOARD_SETTINGS_ACCOUNT_PATH)
          }
          className="font-heading text-sm font-bold text-[#0CC1E0] transition-colors hover:text-[#031F82]"
        >
          ← {step === "details" ? copy.addLinkedBackTrack : copy.addLinkedBackAccounts}
        </button>
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold text-[#031F82]">
            {copy.addLinkedTitle}
          </h1>
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            {step === "track"
              ? copy.addLinkedTrackHint
              : copy.addLinkedDetailsHint}
          </p>
        </div>
      </div>

      {step === "track" ? (
        <section
          aria-labelledby="linked-track-heading"
          className={cn(floatingPanelClass, "space-y-4 p-4")}
        >
          <h2
            id="linked-track-heading"
            className="font-heading text-sm font-extrabold uppercase tracking-wide text-[#031F82]"
          >
            {copy.addLinkedTrackHeading}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {MASTERY_COHORT_ORDER.map((track) => {
              const selected = cohort === track;
              return (
                <button
                  key={track}
                  type="button"
                  onClick={() => setCohort(track)}
                  aria-pressed={selected}
                  className={cn(
                    "flex flex-col items-center rounded-xl border-2 px-3 py-3 text-center transition-all",
                    selected
                      ? "border-[#0CC1E0] bg-[#BDE9FB]/25 shadow-sm"
                      : "border-[#BDE9FB]/70 bg-white hover:border-[#0CC1E0]/50",
                  )}
                >
                  <span className="relative h-20 w-20">
                    <Image
                      src={TRACK_AVATAR_SRC[track]}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-contain"
                      unoptimized
                    />
                  </span>
                  <span className="mt-2 font-heading text-sm font-extrabold text-[#031F82]">
                    {masteryCohortLabel(track)}
                  </span>
                  <span className="mt-0.5 font-sans text-xs font-semibold text-[#1E3A5F]/80">
                    Ages {masteryCohortAgeRangeLabel(track)}
                  </span>
                </button>
              );
            })}
          </div>
          <Button
            type="button"
            variant="cta"
            fullWidth
            disabled={!cohort}
            onClick={handleContinueToDetails}
          >
            {copy.addLinkedContinue}
          </Button>
        </section>
      ) : (
        <form
          className={cn(floatingPanelClass, "space-y-4 p-4")}
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="space-y-1">
            <h2 className="font-heading text-sm font-extrabold uppercase tracking-wide text-[#031F82]">
              {copy.addLinkedDetailsHeading}
            </h2>
            {cohort ? (
              <p className="font-sans text-sm text-[#1E3A5F]">
                {masteryCohortLabel(cohort)} · Ages{" "}
                {masteryCohortAgeRangeLabel(cohort)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="linked-username"
              className="block font-heading text-sm font-bold text-nga-primary"
            >
              {copy.addLinkedUsernameLabel}
            </label>
            <input
              id="linked-username"
              name="username"
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Choose a username"
              value={username}
              onChange={(e) => {
                const nextValue = e.target.value;
                setUsername(
                  isInternalPlaceholderUsername(nextValue) ? "" : nextValue,
                );
                clearError("username");
              }}
              aria-invalid={Boolean(errors.username)}
              className={cn(
                fieldBase,
                errors.username && "border-red-400 focus:border-red-500",
              )}
            />
            {errors.username ? (
              <p className="font-sans text-sm font-medium text-red-600" role="alert">
                {errors.username}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="linked-password"
              className="block font-heading text-sm font-bold text-nga-primary"
            >
              {copy.addLinkedPasswordLabel}
            </label>
            <input
              id="linked-password"
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
              htmlFor="linked-confirm-password"
              className="block font-heading text-sm font-bold text-nga-primary"
            >
              {copy.addLinkedConfirmPasswordLabel}
            </label>
            <input
              id="linked-confirm-password"
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

          <div className="space-y-2">
            <label
              htmlFor="linked-parent-email"
              className="block font-heading text-sm font-bold text-nga-primary"
            >
              {copy.addLinkedParentEmailLabel}
            </label>
            <input
              id="linked-parent-email"
              name="parentEmail"
              type="email"
              value={householdEmail ?? ""}
              readOnly
              className={cn(fieldBase, "bg-nga-mist/40")}
            />
            <p className="font-sans text-sm italic leading-relaxed text-nga-slate">
              {copy.addLinkedParentEmailHint}
            </p>
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
            {isSubmitting ? copy.addLinkedSubmitting : copy.addLinkedSubmit}
          </Button>
        </form>
      )}
    </div>
  );
}
