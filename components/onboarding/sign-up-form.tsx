"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockedBirthYearSummary } from "@/components/onboarding/locked-birth-year-summary";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { Button } from "@/components/ui/button";
import { captureGuestProgressSnapshot } from "@/lib/onboarding/guest-progress-snapshot";
import {
  convertToRegisteredProfile,
  DASHBOARD_ACADEMY_PATH,
  ONBOARDING_SIGN_UP_PENDING_PATH,
  ONBOARDING_START_PATH,
  readUserSession,
  saveUserSession,
} from "@/lib/onboarding/guest-session";
import { finalizeRegisteredSignup } from "@/lib/onboarding/signup-finalize";
import {
  getMasteryCohortFromBirthYear,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import {
  buildParentConsentApprovalPath,
  createPendingParentConsent,
} from "@/lib/onboarding/parent-consent-pending";
import { upsertRegisteredAccount } from "@/lib/onboarding/registered-accounts";
import { cn } from "@/lib/utils/cn";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{2,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INVALID_EMAIL_ERROR =
  "Please enter a valid email address (e.g. name@example.com).";
const SAME_EMAIL_ERROR =
  "Please enter a parent or guardian's email address that is different from your own.";
const USERNAME_TAKEN_ERROR =
  "That username is already taken. Try adding a favorite number!";

const fieldBase =
  "w-full rounded-nga-lg border-2 border-[#E5E5E5] bg-[#F7F7F7] px-4 py-3 font-sans text-base text-nga-ink transition-colors placeholder:text-nga-slate/60 focus:border-nga-secondary focus:bg-white focus:outline-none";

type FormErrors = {
  username?: string;
  learnerEmail?: string;
  password?: string;
  parentEmail?: string;
  form?: string;
};

function cohortHeader(cohort: MasteryCohort): string {
  switch (cohort) {
    case "explorer":
      return "Save Your Free Explorer Profile";
    case "pathfinder":
      return "Create Your Free Pathfinder Account";
    case "maverick":
      return "Create Your Free Maverick Account";
  }
}

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
  const isExplorer = ageTier === "explorer";
  const isPathfinder = ageTier === "pathfinder";
  const isMaverick = ageTier === "maverick";

  // Never prefill guest Finnster handles - every cohort chooses a new username.
  const [username, setUsername] = useState("");
  const [learnerEmail, setLearnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!birthYear || !existingSession?.birthYearLocked) {
      router.replace(ONBOARDING_START_PATH);
    }
  }, [birthYear, existingSession?.birthYearLocked, router]);

  function clearError(key: keyof FormErrors) {
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function validate(): boolean {
    const next: FormErrors = {};
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      next.username = isExplorer
        ? "Pick a username for your Explorer profile."
        : "Pick a username for your account.";
    } else if (!USERNAME_PATTERN.test(trimmedUsername)) {
      next.username =
        "Use 2-20 letters, numbers, underscores, or hyphens only.";
    } else if (
      existingSession?.genericProfileId &&
      existingSession.username &&
      trimmedUsername.toLowerCase() === existingSession.username.toLowerCase()
    ) {
      // Guest handles return to the pool on register - block reusing the temp nickname.
      next.username = USERNAME_TAKEN_ERROR;
    }

    if (isExplorer) {
      const trimmedParent = parentEmail.trim().toLowerCase();
      if (!trimmedParent) {
        next.parentEmail =
          "Enter a parent or guardian email so they can approve your account.";
      } else if (!EMAIL_PATTERN.test(trimmedParent)) {
        next.parentEmail = INVALID_EMAIL_ERROR;
      }
    }

    if (!password) {
      next.password = "Create a password to secure your account.";
    } else if (password.trim().length < 6) {
      next.password = "Use at least 6 characters for your password.";
    }

    if (isPathfinder || isMaverick) {
      const trimmedLearner = learnerEmail.trim().toLowerCase();
      if (!trimmedLearner) {
        next.learnerEmail = "Enter your email so we can save your account.";
      } else if (!EMAIL_PATTERN.test(trimmedLearner)) {
        next.learnerEmail = INVALID_EMAIL_ERROR;
      }
    }

    if (isPathfinder) {
      const trimmedParent = parentEmail.trim().toLowerCase();
      const trimmedLearner = learnerEmail.trim().toLowerCase();
      if (!trimmedParent) {
        next.parentEmail =
          "Enter a parent or guardian email for the Parent Dashboard.";
      } else if (!EMAIL_PATTERN.test(trimmedParent)) {
        next.parentEmail = INVALID_EMAIL_ERROR;
      } else if (
        trimmedLearner &&
        EMAIL_PATTERN.test(trimmedLearner) &&
        trimmedParent === trimmedLearner
      ) {
        next.parentEmail = SAME_EMAIL_ERROR;
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!birthYear || !ageTier || !validate()) return;

    try {
      if (isExplorer) {
        const pending = createPendingParentConsent({
          parentEmail: parentEmail.trim(),
          childUsername: username.trim(),
          birthYear,
          passcode: password.trim(),
        });
        const session = readUserSession();
        if (session) {
          const withMarketing = {
            ...session,
            marketingOptIn: marketingOptIn === true,
          };
          saveUserSession(withMarketing);
          upsertRegisteredAccount(withMarketing);
        }
        router.push(
          `${ONBOARDING_SIGN_UP_PENDING_PATH}?email=${encodeURIComponent(pending.parentEmail)}&approval=${encodeURIComponent(buildParentConsentApprovalPath(pending.token))}`,
        );
        return;
      }

      captureGuestProgressSnapshot();
      const session = convertToRegisteredProfile({
        username: username.trim(),
        birthYear,
        accountRole: "child",
        learnerEmail: learnerEmail.trim(),
        password,
        parentEmail: isPathfinder ? parentEmail.trim() : undefined,
        marketingOptIn,
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

  return (
    <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md space-y-8 px-1">
        <OnboardingProgress value={50} />

        <div className="space-y-2 text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
            {cohortHeader(ageTier)}
          </h1>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <LockedBirthYearSummary
            birthYear={birthYear}
            ageTier={ageTier}
            signup
          />

          {isExplorer ? (
            <p className="font-sans text-sm font-bold leading-relaxed text-purple-700">
              We need a parent or guardian&apos;s permission before we can
              finalise your profile and save your progress and achievements.
            </p>
          ) : null}

          <div className="space-y-2">
            <label
              htmlFor="signup-username"
              className="block font-heading text-sm font-bold text-nga-primary"
            >
              {isExplorer
                ? "Username"
                : isPathfinder
                  ? "Choose a Username"
                  : "Username"}
            </label>
            <input
              id="signup-username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder={isExplorer ? "e.g. CashDragon88" : "Choose a username"}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                clearError("username");
              }}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={
                isExplorer && !errors.username
                  ? "signup-username-tip"
                  : undefined
              }
              className={cn(
                fieldBase,
                errors.username && "border-red-400 focus:border-red-500",
              )}
            />
            {errors.username ? (
              <p
                className="font-sans text-sm font-medium text-red-600"
                role="alert"
              >
                {errors.username}
              </p>
            ) : isExplorer ? (
              <p
                id="signup-username-tip"
                className="font-sans text-sm italic leading-relaxed text-purple-700"
              >
                Tip: To protect your privacy online, never use your real full
                name as a username!
              </p>
            ) : null}
          </div>

          {isPathfinder || isMaverick ? (
            <div className="space-y-2">
              <label
                htmlFor="signup-learner-email"
                className="block font-heading text-sm font-bold text-nga-primary"
              >
                Your Email Address
              </label>
              <input
                id="signup-learner-email"
                name="learnerEmail"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={learnerEmail}
                onChange={(e) => {
                  setLearnerEmail(e.target.value);
                  clearError("learnerEmail");
                }}
                aria-invalid={Boolean(errors.learnerEmail)}
                className={cn(
                  fieldBase,
                  errors.learnerEmail &&
                    "border-red-400 focus:border-red-500",
                )}
              />
              {errors.learnerEmail ? (
                <p
                  className="font-sans text-sm font-medium text-red-600"
                  role="alert"
                >
                  {errors.learnerEmail}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <label
              htmlFor="signup-password"
              className="block font-heading text-sm font-bold text-nga-primary"
            >
              {isExplorer ? "Create your password" : "Create a Password"}
            </label>
            <input
              id="signup-password"
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
              <p
                className="font-sans text-sm font-medium text-red-600"
                role="alert"
              >
                {errors.password}
              </p>
            ) : null}
          </div>

          {isExplorer || isPathfinder ? (
            <div className="space-y-2">
              <label
                htmlFor="signup-parent-email"
                className="block font-heading text-sm font-bold text-nga-primary"
              >
                {isExplorer
                  ? "Parent or guardian's email address"
                  : "Parent or Guardian's Email Address"}
              </label>
              <input
                id="signup-parent-email"
                name="parentEmail"
                type="email"
                autoComplete="email"
                placeholder="parent@example.com"
                value={parentEmail}
                onChange={(e) => {
                  setParentEmail(e.target.value);
                  clearError("parentEmail");
                }}
                aria-invalid={Boolean(errors.parentEmail)}
                aria-describedby={
                  errors.parentEmail ? undefined : "signup-parent-email-hint"
                }
                className={cn(
                  fieldBase,
                  errors.parentEmail && "border-red-400 focus:border-red-500",
                )}
              />
              {errors.parentEmail ? (
                <p
                  className="font-sans text-sm font-medium text-red-600"
                  role="alert"
                >
                  {errors.parentEmail}
                </p>
              ) : (
                <p
                  id="signup-parent-email-hint"
                  className="font-sans text-sm italic leading-relaxed text-nga-slate"
                >
                  {isExplorer
                    ? "Your parent or guardian's email stays private and is only used to manage account approvals and safety."
                    : "We send your parent or guardian a link so they can set up a Parent Dashboard to view your progress and manage Vault permissions."}
                </p>
              )}
            </div>
          ) : null}

          {errors.form ? (
            <p
              className="font-sans text-sm font-medium text-red-600"
              role="alert"
            >
              {errors.form}
            </p>
          ) : null}

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-[#E5E5E5] text-nga-primary focus:ring-nga-secondary"
            />
            <span className="font-sans text-sm leading-relaxed text-nga-slate">
              Yes, send me occasional tips, progress ideas and updates that help
              me support my child&apos;s money skills journey. (You can
              unsubscribe anytime.)
            </span>
          </label>

          <Button type="submit" variant="cta" fullWidth>
            {isExplorer
              ? "Request Parent Approval"
              : "Create My Free Account"}
          </Button>
        </form>
      </div>
    </section>
  );
}
