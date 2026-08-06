"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockedBirthYearSummary } from "@/components/onboarding/locked-birth-year-summary";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { Button, ButtonLink } from "@/components/ui/button";
import { captureGuestProgressSnapshot } from "@/lib/onboarding/guest-progress-snapshot";
import {
  convertToRegisteredProfile,
  DASHBOARD_ACADEMY_PATH,
  ONBOARDING_SIGN_UP_PENDING_PATH,
  ONBOARDING_START_PATH,
  readUserSession,
} from "@/lib/onboarding/guest-session";
import { finalizeRegisteredSignup } from "@/lib/onboarding/signup-finalize";
import {
  getMasteryCohortFromBirthYear,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import {
  approveParentConsent,
  buildParentConsentApprovalPath,
  createPendingParentConsent,
  readPendingParentConsentByToken,
  type PendingParentConsent,
} from "@/lib/onboarding/parent-consent-pending";
import {
  findRegisteredAccountByUsername,
  upsertRegisteredAccount,
} from "@/lib/onboarding/registered-accounts";
import { cn } from "@/lib/utils/cn";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{2,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INVALID_EMAIL_ERROR =
  "Please enter a valid email address (e.g. name@example.com).";
const SAME_EMAIL_ERROR =
  "Please enter a parent or guardian's email address that is different from your own.";
const USERNAME_TAKEN_ERROR =
  "That username is already taken. Try adding a favorite number!";

function resolveSignupFailureMessage(error: unknown, isExplorer: boolean): string {
  const message = error instanceof Error ? error.message.trim() : "";

  if (message) {
    if (/username is already taken/i.test(message)) {
      return USERNAME_TAKEN_ERROR;
    }
    if (/too many approval|too many email|try again shortly|wait about a minute/i.test(message)) {
      return message;
    }
    if (
      /parent approval email|parent or guardian email|valid parent|approval link|approval-link/i.test(
        message,
      )
    ) {
      return message;
    }
    if (/consent token signature|consent token email|consent token username/i.test(message)) {
      return "We could not verify the approval link for this Explorer. Please try sending again.";
    }
    if (/password must be at least 6|password \(at least 6\)/i.test(message)) {
      return "Use at least 6 characters for your password.";
    }
    if (/birth year|eligible range|ages 10-12|Explorer profiles/i.test(message)) {
      return message;
    }
    if (/learner email/i.test(message)) {
      return message;
    }
    if (/Username is required|Pick a username/i.test(message)) {
      return isExplorer
        ? "Pick a username for your Explorer profile."
        : "Pick a username for your account.";
    }
    // Prefer the thrown message when it is already user-facing.
    if (message.length <= 180 && !/finalizeRegisteredSignup|requires a registered/i.test(message)) {
      return message;
    }
  }

  return isExplorer
    ? "We could not start parent approval for this Explorer profile. Check your details and try again."
    : "We could not create your profile. Check your details and try again.";
}

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

function adultBirthYear(): number {
  return new Date().getFullYear() - 35;
}

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingSession = useMemo(() => readUserSession(), []);

  const consentToken = (searchParams.get("token") ?? "").trim();
  const isParentMaster =
    searchParams.get("role") === "parent_master" && Boolean(consentToken);

  const birthYear = useMemo(() => {
    if (isParentMaster) return adultBirthYear();
    const fromQuery = searchParams.get("birthYear");
    if (fromQuery && Number.isInteger(Number(fromQuery))) {
      return Number(fromQuery);
    }
    return existingSession?.birthYear ?? null;
  }, [existingSession?.birthYear, isParentMaster, searchParams]);

  const ageTier = birthYear ? getMasteryCohortFromBirthYear(birthYear) : null;
  const isExplorer = !isParentMaster && ageTier === "explorer";
  const isPathfinder = !isParentMaster && ageTier === "pathfinder";
  const isMaverick = !isParentMaster && ageTier === "maverick";

  const [username, setUsername] = useState(() =>
    !isParentMaster && existingSession?.username?.trim()
      ? existingSession.username.trim()
      : "",
  );
  const [learnerEmail, setLearnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pendingConsent, setPendingConsent] =
    useState<PendingParentConsent | null>(null);
  const [parentConsentLoading, setParentConsentLoading] = useState(isParentMaster);
  const [isSendingApprovalEmail, setIsSendingApprovalEmail] = useState(false);
  const approvalEmailInFlightRef = useRef(false);

  useEffect(() => {
    if (isParentMaster) return;
    if (!birthYear || !existingSession?.birthYearLocked) {
      router.replace(ONBOARDING_START_PATH);
    }
  }, [birthYear, existingSession?.birthYearLocked, isParentMaster, router]);

  useEffect(() => {
    if (!isParentMaster || !consentToken) return;
    let cancelled = false;

    async function loadConsent() {
      const pending = await readPendingParentConsentByToken(consentToken);
      if (cancelled) return;
      if (!pending) {
        setPendingConsent(null);
        setParentConsentLoading(false);
        setErrors({
          form: "This consent link is invalid or expired. Ask your learner to restart signup.",
        });
        return;
      }
      setPendingConsent(pending);
      setParentEmail(pending.parentEmail);
      setParentConsentLoading(false);
    }

    void loadConsent();
    return () => {
      cancelled = true;
    };
  }, [consentToken, isParentMaster]);

  function clearError(key: keyof FormErrors) {
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function validate(): boolean {
    const next: FormErrors = {};
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      next.username = isParentMaster
        ? "Pick a username for your parent master profile."
        : isExplorer
          ? "Pick a username for your Explorer profile."
          : "Pick a username for your account.";
    } else if (!USERNAME_PATTERN.test(trimmedUsername)) {
      next.username =
        "Use 2-20 letters, numbers, underscores, or hyphens only.";
    } else if (!isParentMaster && trimmedUsername) {
      // Username must be unique; the same parent email may link many children.
      // Guest-step username is inherited and is not "taken".
      const existingAccount = findRegisteredAccountByUsername(trimmedUsername);
      if (
        existingAccount &&
        existingAccount.accountStatus === "ACTIVE" &&
        existingAccount.accessMode === "registered"
      ) {
        next.username = USERNAME_TAKEN_ERROR;
      }
    }

    if (isExplorer) {
      const trimmedParent = parentEmail.trim().toLowerCase();
      if (!trimmedParent) {
        next.parentEmail =
          "Enter a parent or guardian email so they can approve your account.";
      } else if (!EMAIL_PATTERN.test(trimmedParent)) {
        next.parentEmail = INVALID_EMAIL_ERROR;
      }
      // Pre-existing parent emails are allowed — multiple Explorers may share one.
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

    if (isParentMaster) {
      const trimmedParent = parentEmail.trim().toLowerCase();
      if (!trimmedParent || !EMAIL_PATTERN.test(trimmedParent)) {
        next.parentEmail = INVALID_EMAIL_ERROR;
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleParentMasterSubmit() {
    if (!consentToken || !pendingConsent || !validate()) return;

    try {
      // Consent is normally completed on the parent-consent landing CTA.
      // Fall back to approve only if the child is not already ACTIVE.
      const existingChild = readUserSession();
      const alreadyApproved =
        existingChild?.accessMode === "registered" &&
        existingChild.username === pendingConsent.childUsername &&
        existingChild.birthYear === pendingConsent.birthYear &&
        existingChild.parentEmail?.trim().toLowerCase() ===
          pendingConsent.parentEmail.trim().toLowerCase() &&
        (existingChild.accountStatus === "ACTIVE" ||
          Boolean(existingChild.consentApprovedAt));

      const childSession = alreadyApproved
        ? existingChild
        : await approveParentConsent(consentToken);

      if (!childSession) {
        setErrors({
          form: "We could not approve this profile. The consent link may have expired. Restart signup to request a new approval email.",
        });
        return;
      }

      const parentSession = convertToRegisteredProfile({
        username: username.trim(),
        birthYear: adultBirthYear(),
        accountRole: "parent_master",
        learnerEmail: pendingConsent.parentEmail,
        password: password.trim(),
        accountStatus: "ACTIVE",
        marketingOptIn,
      });
      await finalizeRegisteredSignup(parentSession, { skipEmail: true });
      // Keep child in the durable registry (already upserted during approve).
      upsertRegisteredAccount(childSession);
      router.push(DASHBOARD_ACADEMY_PATH);
    } catch (error) {
      const message = resolveSignupFailureMessage(error, false);
      setErrors({
        form: /could not create your profile/i.test(message)
          ? "We could not create your parent master profile. Check your details and try again."
          : message,
      });
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isParentMaster) {
      await handleParentMasterSubmit();
      return;
    }

    if (!birthYear || !ageTier || !validate()) return;

    if (isExplorer) {
      if (approvalEmailInFlightRef.current) return;
      approvalEmailInFlightRef.current = true;
      setIsSendingApprovalEmail(true);

      try {
        const pending = await createPendingParentConsent({
          parentEmail: parentEmail.trim(),
          childUsername: username.trim(),
          birthYear,
          passcode: password.trim(),
        });
        router.push(
          `${ONBOARDING_SIGN_UP_PENDING_PATH}?email=${encodeURIComponent(pending.parentEmail)}&approval=${encodeURIComponent(buildParentConsentApprovalPath(pending.token))}`,
        );
      } catch (error) {
        approvalEmailInFlightRef.current = false;
        setIsSendingApprovalEmail(false);
        setErrors((prev) => ({
          ...prev,
          form: resolveSignupFailureMessage(error, true),
        }));
      }
      return;
    }

    try {
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
      await finalizeRegisteredSignup(session);
      router.push(DASHBOARD_ACADEMY_PATH);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: resolveSignupFailureMessage(error, false),
      }));
    }
  }

  if (isParentMaster) {
    if (parentConsentLoading) {
      return (
        <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
          <div className="mx-auto w-full max-w-md px-1 text-center">
            <p className="font-sans text-sm text-nga-slate">
              Loading parent approval…
            </p>
          </div>
        </section>
      );
    }

    if (!pendingConsent) {
      return (
        <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
          <div className="mx-auto w-full max-w-md space-y-6 px-1 text-center">
            <h1 className="font-heading text-2xl font-extrabold text-nga-primary">
              This consent link expired
            </h1>
            <p className="font-sans text-sm text-nga-slate">
              {errors.form ??
                "This consent link is invalid or expired. Ask your learner to restart signup."}
            </p>
            <ButtonLink href="/onboarding/start?fresh=1" variant="cta" fullWidth>
              Restart signup
            </ButtonLink>
          </div>
        </section>
      );
    }

    return (
      <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
        <div className="mx-auto w-full max-w-md space-y-8 px-1">
          <OnboardingProgress value={100} />
          <div className="space-y-2 text-center">
            <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
              Create Your Parent Master Profile
            </h1>
            {pendingConsent ? (
              <p className="font-sans text-sm leading-relaxed text-nga-slate">
                Consent approved for{" "}
                <span className="font-semibold text-nga-primary">
                  {pendingConsent.childUsername}
                </span>
                . Create your parent master login to finish.
              </p>
            ) : null}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <label
                htmlFor="signup-username"
                className="block font-heading text-sm font-bold text-nga-primary"
              >
                Username
              </label>
              <input
                id="signup-username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearError("username");
                }}
                aria-invalid={Boolean(errors.username)}
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
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="signup-parent-email"
                className="block font-heading text-sm font-bold text-nga-primary"
              >
                Parent or guardian&apos;s email address
              </label>
              <input
                id="signup-parent-email"
                name="parentEmail"
                type="email"
                autoComplete="email"
                value={parentEmail}
                readOnly
                className={cn(fieldBase, "bg-nga-mist/40")}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="signup-password"
                className="block font-heading text-sm font-bold text-nga-primary"
              >
                Create your password
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

            {errors.form ? (
              <div className="space-y-3">
                <p
                  className="font-sans text-sm font-medium text-red-600"
                  role="alert"
                >
                  {errors.form}
                </p>
                <ButtonLink
                  href="/onboarding/start?fresh=1"
                  variant="secondary"
                  fullWidth
                >
                  Restart signup
                </ButtonLink>
              </div>
            ) : null}

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-[#E5E5E5] text-nga-primary focus:ring-nga-secondary"
              />
              <span className="font-sans text-sm leading-relaxed text-nga-slate">
                Yes, send me occasional tips, progress ideas and updates that
                help me support my child&apos;s money skills journey. (You can
                unsubscribe anytime.)
              </span>
            </label>

            <Button type="submit" variant="cta" fullWidth>
              Create Master Profile
            </Button>
          </form>
        </div>
      </section>
    );
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
              Username
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
              Create your password
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
                Parent or guardian&apos;s email address
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

          {!isExplorer ? (
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-[#E5E5E5] text-nga-primary focus:ring-nga-secondary"
              />
              <span className="font-sans text-sm leading-relaxed text-nga-slate">
                Yes, send me occasional tips, progress ideas and updates that
                help me support my money skills journey. (You can unsubscribe
                anytime.)
              </span>
            </label>
          ) : null}

          <Button
            type="submit"
            variant="cta"
            fullWidth
            disabled={isSendingApprovalEmail}
            aria-busy={isSendingApprovalEmail || undefined}
          >
            {isExplorer
              ? isSendingApprovalEmail
                ? "Sending…"
                : "Request Parent Approval"
              : "Create My Free Account"}
          </Button>
        </form>
      </div>
    </section>
  );
}
