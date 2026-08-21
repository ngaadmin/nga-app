"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { Button, ButtonLink } from "@/components/ui/button";
import { CreateParentProfilePanel } from "@/components/dashboard/settings/create-parent-profile-panel";
import { copyMatrix } from "@/constants/copyMatrix";
import { createParentMasterAndApprove, approveConsentRequest } from "@/lib/onboarding/approve-consent-request";
import { createSupabaseAccount } from "@/lib/onboarding/create-supabase-account";
import { representativeBirthYearForCohort } from "@/lib/onboarding/birth-years";
import {
  displayUsernameOrEmpty,
  isInternalPlaceholderUsername,
} from "@/lib/onboarding/placeholder-username";
import {
  convertToRegisteredProfile,
  DASHBOARD_ACADEMY_PATH,
  DASHBOARD_SETTINGS_ACCOUNT_PATH,
  isGuestSession,
  ONBOARDING_PARENT_CONSENT_PATH,
  ONBOARDING_SIGN_IN_PATH,
  ONBOARDING_SIGN_UP_LEARNER_PATH,
  ONBOARDING_SIGN_UP_PARENT_PATH,
  ONBOARDING_SIGN_UP_PATH,
  ONBOARDING_SIGN_UP_PENDING_PATH,
  readUserSession,
} from "@/lib/onboarding/guest-session";
import { finalizeRegisteredSignup } from "@/lib/onboarding/signup-finalize";
import {
  getMasteryCohortFromBirthYear,
  MASTERY_COHORT_ORDER,
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
  requiresParentConsentForBirthYear,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import {
  lookupConsentToken,
  type PendingParentConsent,
} from "@/lib/onboarding/parent-consent-pending";
import {
  findActiveParentMasterByEmail,
  findRegisteredAccountByUsername,
} from "@/lib/onboarding/registered-accounts";
import { cn } from "@/lib/utils/cn";
import { EMAIL_PATTERN } from "@/lib/validation/email";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{2,20}$/;

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
  confirmPassword?: string;
  parentEmail?: string;
  parentalConsent?: string;
  track?: string;
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

function guestSelectedTrack(
  session: ReturnType<typeof readUserSession>,
): MasteryCohort | null {
  if (!isGuestSession(session) || !session) return null;
  const track = session.curriculumCohort;
  if (track === "explorer" || track === "pathfinder" || track === "maverick") {
    return track;
  }
  return null;
}

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingSession = useMemo(() => readUserSession(), []);
  const consentToken = (searchParams.get("token") ?? "").trim();
  const isParentMaster =
    searchParams.get("role") === "parent_master" && Boolean(consentToken);
  const accountAs = (searchParams.get("as") ?? "").trim().toLowerCase();
  const fromParam = (searchParams.get("from") ?? "").trim();
  const fromAccount = fromParam === "account";
  const fromLoginCreate = fromParam === "login";
  const isGuestParentCreate = !isParentMaster && accountAs === "parent";
  const showRoleChoice = !isParentMaster && accountAs !== "learner" && accountAs !== "parent";

  const [cohort, setCohort] = useState<MasteryCohort | null>(() => {
    if (isParentMaster) return null;
    return guestSelectedTrack(existingSession);
  });

  const ageTier = isParentMaster ? null : cohort;
  const isExplorer = !isParentMaster && ageTier === "explorer";
  const isPathfinder = !isParentMaster && ageTier === "pathfinder";
  const isMaverick = !isParentMaster && ageTier === "maverick";

  const [username, setUsername] = useState("");
  const [learnerEmail, setLearnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [parentalConsentGiven, setParentalConsentGiven] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pendingConsent, setPendingConsent] =
    useState<PendingParentConsent | null>(null);
  /** Explorer VPC create-master vs Pathfinder optional dashboard claim. */
  const [parentMasterFlow, setParentMasterFlow] = useState<
    "explorer_consent" | "pathfinder_claim" | null
  >(null);
  const [parentConsentLoading, setParentConsentLoading] = useState(isParentMaster);
  const [isSendingApprovalEmail, setIsSendingApprovalEmail] = useState(false);
  const [approvalSavedUsername, setApprovalSavedUsername] = useState<string | null>(
    null,
  );
  const approvalEmailInFlightRef = useRef(false);
  const isExplorerConsentFlow = parentMasterFlow === "explorer_consent";
  const isPathfinderClaimFlow = parentMasterFlow === "pathfinder_claim";

  useEffect(() => {
    if (isInternalPlaceholderUsername(username)) {
      setUsername("");
    }
  }, [username]);

  useEffect(() => {
    if (!isParentMaster || !consentToken) return;
    let cancelled = false;

    async function loadConsent() {
      const lookup = await lookupConsentToken(consentToken);
      if (cancelled) return;

      if (lookup.status === "expired") {
        router.replace(
          `${ONBOARDING_PARENT_CONSENT_PATH}?token=${encodeURIComponent(consentToken)}`,
        );
        return;
      }

      if (lookup.status !== "valid" || !lookup.pending) {
        setPendingConsent(null);
        setParentMasterFlow(null);
        setParentConsentLoading(false);
        setErrors({
          form: "This link is invalid or expired. Ask your learner to restart signup, or sign in if you already have a master account.",
        });
        return;
      }

      const pending = lookup.pending;

      const flow = requiresParentConsentForBirthYear(pending.birthYear)
        ? "explorer_consent"
        : getMasteryCohortFromBirthYear(pending.birthYear) === "pathfinder"
          ? "pathfinder_claim"
          : null;

      if (!flow) {
        setPendingConsent(null);
        setParentMasterFlow(null);
        setParentConsentLoading(false);
        setErrors({
          form: "This parent link is not valid for creating a master account.",
        });
        return;
      }

      // Explorer VPC: existing parent master auto-approves; otherwise create-account.
      if (flow === "explorer_consent") {
        const approved = await approveConsentRequest(consentToken);
        if (cancelled) return;

        if (approved.success) {
          setApprovalSavedUsername(approved.childUsername);
          setPendingConsent(null);
          setParentMasterFlow(null);
          setParentConsentLoading(false);
          return;
        }

        if (!approved.needsParentAccount) {
          setPendingConsent(null);
          setParentMasterFlow(null);
          setParentConsentLoading(false);
          setErrors({
            form:
              approved.error ||
              "We could not approve this learner. Try again or use a fresh approval email.",
          });
          return;
        }
      }

      // Pathfinder claim links are FYI only when a master already exists locally.
      if (
        flow === "pathfinder_claim" &&
        findActiveParentMasterByEmail(pending.parentEmail)
      ) {
        setPendingConsent(null);
        setParentMasterFlow(null);
        setParentConsentLoading(false);
        setErrors({
          form: "A master account already exists for this email. Sign in to open your parent dashboard - this Pathfinder is already linked.",
        });
        return;
      }

      setPendingConsent(pending);
      setParentMasterFlow(flow);
      setParentEmail(pending.parentEmail);
      setParentConsentLoading(false);
    }

    void loadConsent();
    return () => {
      cancelled = true;
    };
  }, [consentToken, isParentMaster, router]);

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
    } else if (isInternalPlaceholderUsername(trimmedUsername)) {
      next.username = "Pick a username you choose yourself.";
    } else if (!USERNAME_PATTERN.test(trimmedUsername)) {
      next.username =
        "Use 2-20 letters, numbers, underscores, or hyphens only.";
    } else if (!isParentMaster && trimmedUsername) {
      // Username must be unique; the same parent email may link many children.
      const existingAccount = findRegisteredAccountByUsername(trimmedUsername);
      if (
        existingAccount &&
        existingAccount.accountStatus === "ACTIVE" &&
        existingAccount.accessMode === "registered"
      ) {
        next.username = USERNAME_TAKEN_ERROR;
      }
    }

    if (!isParentMaster) {
      if (!cohort) {
        next.track = "Pick the learning track for this profile.";
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

    if (!isParentMaster) {
      if (!confirmPassword) {
        next.confirmPassword = "Confirm your password.";
      } else if (password && confirmPassword !== password) {
        next.confirmPassword = "Passwords don't match.";
      }
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
      // Explorer VPC only — Pathfinder claim does not require consent.
      if (isExplorerConsentFlow && !parentalConsentGiven) {
        next.parentalConsent =
          "Tick the parental consent box to approve this learner profile and create your master account.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleParentMasterSubmit() {
    if (!consentToken || !pendingConsent || !parentMasterFlow || !validate()) {
      return;
    }

    try {
      const result = await createParentMasterAndApprove({
        token: consentToken,
        username: username.trim(),
        password: password.trim(),
        marketingOptIn,
      });

      if (!result.success) {
        setErrors({ form: result.error });
        return;
      }

      // Local session so the dashboard gate still recognizes this parent.
      const parentSession = convertToRegisteredProfile({
        username: result.parentUsername,
        birthYear: adultBirthYear(),
        accountRole: "parent_master",
        curriculumCohort: "maverick",
        learnerEmail: result.parentEmail,
        password: password.trim(),
        accountStatus: "ACTIVE",
        marketingOptIn,
        supabaseUserId: result.parentId,
      });
      await finalizeRegisteredSignup(parentSession);
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

    if (!cohort || !validate()) return;

    if (approvalEmailInFlightRef.current) return;
    approvalEmailInFlightRef.current = true;
    setIsSendingApprovalEmail(true);

    try {
      const result = await createSupabaseAccount({
        username: username.trim(),
        cohort,
        password: password.trim(),
        learnerEmail: isPathfinder || isMaverick ? learnerEmail.trim() : undefined,
        parentEmail: isExplorer || isPathfinder ? parentEmail.trim() : undefined,
        marketingOptIn,
      });

      if (!result.success) {
        approvalEmailInFlightRef.current = false;
        setIsSendingApprovalEmail(false);
        if (/username is already taken/i.test(result.error)) {
          setErrors((prev) => ({
            ...prev,
            username: USERNAME_TAKEN_ERROR,
            form: undefined,
          }));
          return;
        }
        setErrors((prev) => ({
          ...prev,
          form: resolveSignupFailureMessage(new Error(result.error), isExplorer),
        }));
        return;
      }

      const isPendingConsent =
        result.accountStatus === "pending_consent" || result.cohort === "explorer";
      const childSession = convertToRegisteredProfile({
        username: result.username,
        birthYear: representativeBirthYearForCohort(cohort),
        accountRole: "child",
        parentEmail: isExplorer || isPathfinder ? parentEmail.trim() : undefined,
        learnerEmail:
          isPathfinder || isMaverick ? learnerEmail.trim() : undefined,
        password: password.trim(),
        accountStatus: isPendingConsent ? "PENDING_CONSENT" : "ACTIVE",
        marketingOptIn,
        supabaseUserId: result.userId,
        curriculumCohort: cohort,
      });
      await finalizeRegisteredSignup(childSession, { skipEmail: true });

      if (isPendingConsent) {
        router.push(ONBOARDING_SIGN_UP_PENDING_PATH);
        return;
      }

      router.replace(DASHBOARD_ACADEMY_PATH);
    } catch (error) {
      approvalEmailInFlightRef.current = false;
      setIsSendingApprovalEmail(false);
      setErrors((prev) => ({
        ...prev,
        form: resolveSignupFailureMessage(error, isExplorer),
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

    if (approvalSavedUsername) {
      const approvalCopy = copyMatrix.onboarding.approvalSaved;
      const heading = approvalCopy.heading.replace(
        "{username}",
        displayUsernameOrEmpty(approvalSavedUsername) || "your learner",
      );
      return (
        <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
          <div className="mx-auto w-full max-w-md space-y-6 px-1 text-center">
            <h1 className="font-heading text-2xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
              {heading}
            </h1>
            <p className="font-sans text-sm leading-relaxed text-nga-slate sm:text-base">
              {approvalCopy.body}
            </p>
            <ButtonLink href={ONBOARDING_SIGN_IN_PATH} variant="cta" fullWidth>
              {approvalCopy.logIn}
            </ButtonLink>
          </div>
        </section>
      );
    }

    if (!pendingConsent) {
      return (
        <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
          <div className="mx-auto w-full max-w-md space-y-6 px-1 text-center">
            <h1 className="font-heading text-2xl font-extrabold text-nga-primary">
              Parent link unavailable
            </h1>
            <p className="font-sans text-sm text-nga-slate">
              {errors.form ??
                "This link is invalid or expired. Ask your learner to restart signup."}
            </p>
            <div className="space-y-2">
              <ButtonLink href={ONBOARDING_SIGN_IN_PATH} variant="cta" fullWidth>
                Sign in
              </ButtonLink>
              <ButtonLink
                href="/onboarding/start?fresh=1"
                variant="ghost"
                fullWidth
              >
                Restart signup
              </ButtonLink>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
        <div className="mx-auto w-full max-w-md space-y-8 px-1">
          <OnboardingProgress value={100} />
          <div className="space-y-3 text-center">
            <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
              Create Your Parent Master Profile
            </h1>
            <p className="font-sans text-base leading-relaxed text-nga-slate sm:text-lg">
              {isPathfinderClaimFlow
                ? "Optionally create your master login to follow this Pathfinder's progress."
                : "Finish setup for this learner, then create your master login."}
            </p>
          </div>

          <div className="rounded-nga-lg border-2 border-nga-panel bg-nga-mist/40 px-4 py-5 text-center">
            <p className="font-heading text-xs font-bold uppercase tracking-wide text-nga-slate">
              Learner username
            </p>
            <p className="mt-2 font-heading text-xl font-extrabold leading-tight text-nga-primary sm:text-2xl">
              {displayUsernameOrEmpty(pendingConsent.childUsername) ||
                "your learner"}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <label
                htmlFor="signup-username"
                className="block font-heading text-sm font-bold text-nga-primary"
              >
                Your master username
              </label>
              <input
                id="signup-username"
                name="chosen-username"
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

            {isExplorerConsentFlow ? (
              <div className="space-y-2">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={parentalConsentGiven}
                    onChange={(e) => {
                      setParentalConsentGiven(e.target.checked);
                      clearError("parentalConsent");
                    }}
                    aria-invalid={Boolean(errors.parentalConsent)}
                    aria-describedby={
                      errors.parentalConsent
                        ? "parental-consent-error"
                        : undefined
                    }
                    className="mt-1 h-4 w-4 shrink-0 rounded border-[#E5E5E5] text-nga-primary focus:ring-nga-secondary"
                  />
                  <span className="font-sans text-base leading-relaxed text-nga-ink">
                    I am the parent or legal guardian of{" "}
                    <span className="font-semibold text-nga-primary">
                      {displayUsernameOrEmpty(pendingConsent.childUsername) ||
                        "this learner"}
                    </span>
                    , and I approve their NextGenAchiever$ profile.{" "}
                    <span className="font-semibold text-nga-primary">
                      (Required)
                    </span>
                  </span>
                </label>
                {errors.parentalConsent ? (
                  <p
                    id="parental-consent-error"
                    className="font-sans text-sm font-medium text-red-600"
                    role="alert"
                  >
                    {errors.parentalConsent}
                  </p>
                ) : null}
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

            <Button
              type="submit"
              variant="cta"
              fullWidth
              disabled={isExplorerConsentFlow && !parentalConsentGiven}
            >
              Create Master Profile
            </Button>
          </form>
        </div>
      </section>
    );
  }

  if (isGuestParentCreate) {
    return (
      <CreateParentProfilePanel
        backHref={
          fromAccount ? DASHBOARD_SETTINGS_ACCOUNT_PATH : ONBOARDING_SIGN_UP_PATH
        }
      />
    );
  }

  if (showRoleChoice) {
    const choice = copyMatrix.onboarding.chooseAccount;
    return (
      <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
        <div className="mx-auto w-full max-w-md space-y-8 px-1">
          <OnboardingProgress value={40} />
          <div className="space-y-2 text-center">
            <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
              {choice.title}
            </h1>
          </div>
          <div className="space-y-3">
            <ButtonLink
              href={
                fromLoginCreate
                  ? `${ONBOARDING_SIGN_UP_LEARNER_PATH}&from=login`
                  : ONBOARDING_SIGN_UP_LEARNER_PATH
              }
              variant="cta"
              fullWidth
            >
              {choice.learner}
            </ButtonLink>
            <ButtonLink
              href={ONBOARDING_SIGN_UP_PARENT_PATH}
              variant="secondary"
              fullWidth
            >
              {choice.parent}
            </ButtonLink>
          </div>
          <p className="text-center font-sans text-sm text-nga-slate">
            {copyMatrix.onboarding.signIn.alreadyHaveAccount}{" "}
            <Link
              href={ONBOARDING_SIGN_IN_PATH}
              className="font-heading font-bold text-nga-secondary underline-offset-2 hover:underline"
            >
              {copyMatrix.onboarding.signIn.heroLogIn}
            </Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md space-y-8 px-1">
        <OnboardingProgress value={50} />

        {fromAccount || accountAs === "learner" ? (
          <button
            type="button"
            onClick={() =>
              router.push(
                fromAccount
                  ? DASHBOARD_SETTINGS_ACCOUNT_PATH
                  : fromLoginCreate
                    ? `${ONBOARDING_SIGN_UP_PATH}?from=login`
                    : ONBOARDING_SIGN_UP_PATH,
              )
            }
            className="font-heading text-sm font-bold text-nga-secondary transition-colors hover:text-nga-primary"
          >
            ← Back
          </button>
        ) : null}

        <div className="space-y-2 text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
            {fromLoginCreate
              ? "Create your account"
              : ageTier
                ? cohortHeader(ageTier)
                : "Save Your Progress"}
          </h1>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <fieldset className="space-y-2">
            <legend className="block font-heading text-sm font-bold text-nga-primary">
              Your learning track
            </legend>
            <p className="font-sans text-sm text-nga-slate">
              {cohort
                ? "This track is already chosen. You can change it."
                : "Pick a track. You can change it later."}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {MASTERY_COHORT_ORDER.map((track) => {
                const selected = cohort === track;
                return (
                  <button
                    key={track}
                    type="button"
                    onClick={() => {
                      setCohort(track);
                      clearError("track");
                    }}
                    aria-pressed={selected}
                    className={cn(
                      "rounded-nga-lg border-2 px-3 py-3 text-center transition-colors",
                      selected
                        ? "border-nga-secondary bg-nga-mist/60"
                        : "border-[#E5E5E5] bg-[#F7F7F7] hover:border-nga-secondary/50",
                    )}
                  >
                    <span className="block font-heading text-sm font-extrabold text-nga-primary">
                      {masteryCohortLabel(track)}
                    </span>
                    <span className="mt-0.5 block font-sans text-xs font-semibold text-nga-slate">
                      Ages {masteryCohortAgeRangeLabel(track)}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.track ? (
              <p className="font-sans text-sm font-medium text-red-600" role="alert">
                {errors.track}
              </p>
            ) : null}
          </fieldset>

          <div className="space-y-2">
            <label
              htmlFor="signup-username"
              className="block font-heading text-sm font-bold text-nga-primary"
            >
              Username
            </label>
            <p
              id="signup-username-tip"
              className="font-sans text-sm font-bold text-purple-700"
            >
              Tip: don&apos;t use your real full name.
            </p>
            <input
              id="signup-username"
              name="chosen-username"
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder={isExplorer ? "e.g. CashDragon88" : "Choose a username"}
              value={username}
              onChange={(e) => {
                const nextValue = e.target.value;
                setUsername(
                  isInternalPlaceholderUsername(nextValue) ? "" : nextValue,
                );
                clearError("username");
              }}
              aria-invalid={Boolean(errors.username)}
              aria-describedby="signup-username-tip"
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
              ) : (
                <p className="font-sans text-sm italic leading-relaxed text-nga-slate">
                  For account updates only. You log in with your username.
                </p>
              )}
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

          <div className="space-y-2">
            <label
              htmlFor="signup-confirm-password"
              className="block font-heading text-sm font-bold text-nga-primary"
            >
              Confirm password
            </label>
            <input
              id="signup-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
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
              <p
                className="font-sans text-sm font-medium text-red-600"
                role="alert"
              >
                {errors.confirmPassword}
              </p>
            ) : null}
          </div>

          {isExplorer || isPathfinder ? (
            <div className="space-y-2">
              <label
                htmlFor="signup-parent-email"
                className="block font-heading text-sm font-bold text-nga-primary"
              >
                Parent/guardian email address
              </label>
              {isExplorer ? (
                <p
                  id="signup-parent-email-hint"
                  className="font-sans text-sm font-bold text-purple-700"
                >
                  A parent/guardian needs to approve this.
                </p>
              ) : null}
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
                  isExplorer
                    ? "signup-parent-email-hint"
                    : errors.parentEmail
                      ? undefined
                      : "signup-parent-email-hint"
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
              ) : isExplorer ? null : (
                <p
                  id="signup-parent-email-hint"
                  className="font-sans text-sm italic leading-relaxed text-nga-slate"
                >
                  We send your parent or guardian a link so they can set up a Parent Dashboard to view your progress and manage Vault permissions.
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
              : isSendingApprovalEmail
                ? "Creating…"
                : "Create My Free Account"}
          </Button>
        </form>
      </div>
    </section>
  );
}
