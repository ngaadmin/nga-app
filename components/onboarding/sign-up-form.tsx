"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockedBirthYearSummary } from "@/components/onboarding/locked-birth-year-summary";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { Button } from "@/components/ui/button";
import {
  captureGhostProgressSnapshot,
} from "@/lib/onboarding/ghost-progress-snapshot";
import {
  convertToRegisteredProfile,
  DASHBOARD_ACADEMY_PATH,
  ONBOARDING_SIGN_UP_PENDING_PATH,
  ONBOARDING_START_PATH,
  readUserSession,
} from "@/lib/onboarding/ghost-session";
import { finalizeRegisteredSignup } from "@/lib/onboarding/signup-finalize";
import {
  getMasteryCohortFromBirthYear,
  masteryCohortLabel,
  requiresParentConsent,
} from "@/lib/dashboard/mastery-cohort";
import {
  buildParentConsentApprovalPath,
  createPendingParentConsent,
} from "@/lib/onboarding/parent-consent-pending";
import { cn } from "@/lib/utils/cn";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{2,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldBase =
  "w-full rounded-nga-lg border-2 border-[#E5E5E5] bg-[#F7F7F7] px-4 py-3 font-sans text-base text-nga-ink transition-colors placeholder:text-nga-slate/60 focus:border-nga-secondary focus:bg-white focus:outline-none";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingSession = useMemo(() => readUserSession(), []);

  const birthYear = useMemo(() => {
    const fromQuery = searchParams.get("birthYear");
    if (fromQuery && Number.isInteger(Number(fromQuery))) {
      return Number(fromQuery);
    }
    return existingSession?.birthYear ?? null;
  }, [existingSession?.birthYear, searchParams]);

  const ageTier = birthYear ? getMasteryCohortFromBirthYear(birthYear) : null;
  const needsParentConsent = ageTier ? requiresParentConsent(ageTier) : false;

  const [username, setUsername] = useState(() => {
    return (
      searchParams.get("username") ??
      existingSession?.username ??
      ""
    );
  });
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    form?: string;
  }>({});

  useEffect(() => {
    if (!birthYear || !existingSession?.birthYearLocked) {
      router.replace(ONBOARDING_START_PATH);
    }
  }, [birthYear, existingSession?.birthYearLocked, router]);

  function validate(): boolean {
    const next: typeof errors = {};
    const trimmed = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmed) {
      next.username = "Pick a nickname for your saved profile.";
    } else if (!USERNAME_PATTERN.test(trimmed)) {
      next.username =
        "Use 2–20 letters, numbers, underscores, or hyphens only.";
    }

    if (!trimmedEmail) {
      next.email = needsParentConsent
        ? "Enter a parent or guardian email so they can approve your account."
        : "Enter your email so we can save your account.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      next.email = "Enter a valid email address.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!birthYear || !validate()) return;

    try {
      if (needsParentConsent) {
        const pending = createPendingParentConsent({
          parentEmail: email.trim(),
          childUsername: username.trim(),
          birthYear,
        });
        router.push(
          `${ONBOARDING_SIGN_UP_PENDING_PATH}?email=${encodeURIComponent(pending.parentEmail)}&approval=${encodeURIComponent(buildParentConsentApprovalPath(pending.token))}`,
        );
        return;
      }

      captureGhostProgressSnapshot();
      const session = convertToRegisteredProfile({
        username: username.trim(),
        email: email.trim(),
        birthYear,
        accountRole: "child",
      });
      finalizeRegisteredSignup(session);
      router.push(DASHBOARD_ACADEMY_PATH);
    } catch {
      setErrors((prev) => ({
        ...prev,
        form: "We could not create your profile. Check your details and try again.",
      }));
    }
  }

  if (!birthYear || !ageTier) {
    return null;
  }

  const isGhostConversion = existingSession?.accessMode === "ghost";
  const tierLabel = masteryCohortLabel(ageTier);

  return (
    <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md space-y-8 px-1">
        <OnboardingProgress value={50} />

        <div className="space-y-2 text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
            {needsParentConsent
              ? "Almost There, Explorer!"
              : "Create Your Free Profile"}
          </h1>
          <p className="font-sans text-sm leading-relaxed text-nga-slate">
            {needsParentConsent
              ? "Finn needs a parent or guardian to give the green light before we save your profile. Your ghost progress stays safe while you wait."
              : isGhostConversion
                ? "Your points, skills, and lesson progress carry over automatically."
                : "Save your streak, points, and skills across every visit."}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <LockedBirthYearSummary birthYear={birthYear} ageTier={ageTier} />

          {needsParentConsent ? (
            <div className="rounded-nga-lg border-2 border-[#BDE9FB] bg-[#BDE9FB]/20 px-4 py-3 font-sans text-sm leading-relaxed text-nga-ink">
              <p className="font-heading text-sm font-bold text-nga-primary">
                Why a parent email?
              </p>
              <p className="mt-1">
                Explorers under 14 need a parent to own the master account and
                approve signup. We&apos;ll email them a secure link — no paid
                upgrade, just safety first.
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label
              htmlFor="signup-username"
              className="block font-heading text-sm font-bold text-nga-primary"
            >
              Nickname / Username
            </label>
            <input
              id="signup-username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Pick the name you want to keep"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username) {
                  setErrors((prev) => ({ ...prev, username: undefined }));
                }
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
              htmlFor="signup-email"
              className="block font-heading text-sm font-bold text-nga-primary"
            >
              {needsParentConsent ? "Parent or guardian email" : "Your email"}
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete={needsParentConsent ? "email" : "email"}
              placeholder={
                needsParentConsent ? "parent@example.com" : "you@example.com"
              }
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              aria-invalid={Boolean(errors.email)}
              className={cn(
                fieldBase,
                errors.email && "border-red-400 focus:border-red-500",
              )}
            />
            {errors.email ? (
              <p className="font-sans text-sm font-medium text-red-600" role="alert">
                {errors.email}
              </p>
            ) : (
              <p className="font-sans text-sm italic text-nga-slate">
                {needsParentConsent
                  ? "We never ask Explorers for their own email — just a trusted adult."
                  : `${tierLabel} signup — your email stays private and is never used for marketing.`}
              </p>
            )}
          </div>

          {errors.form ? (
            <p className="font-sans text-sm font-medium text-red-600" role="alert">
              {errors.form}
            </p>
          ) : null}

          <Button type="submit" variant="cta" fullWidth>
            {needsParentConsent
              ? "Send Consent Email to Parent"
              : "Create My Free Account"}
          </Button>
        </form>
      </div>
    </section>
  );
}
