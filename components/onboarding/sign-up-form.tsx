"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LearnerBirthYearField, learnerFieldClass } from "@/components/onboarding/learner-birth-year-field";
import { LearnerTrackCards } from "@/components/onboarding/learner-track-cards";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { Button, ButtonLink } from "@/components/ui/button";
import { CreateParentProfilePanel } from "@/components/dashboard/settings/create-parent-profile-panel";
import { copyMatrix } from "@/constants/copyMatrix";
import { createParentMasterAndApprove, approveConsentRequest } from "@/lib/onboarding/approve-consent-request";
import { createSupabaseAccount } from "@/lib/onboarding/create-supabase-account";
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
import { markExplorerPendingPlayAllowed } from "@/lib/onboarding/explorer-pending-consent";
import { markParentFirstWelcomePending } from "@/lib/onboarding/parent-first-welcome";
import { finalizeRegisteredSignup } from "@/lib/onboarding/signup-finalize";
import {
  parseMasteryCohort,
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
import {
  ageTrackFitMessage,
  decideLearnerAge,
} from "@/lib/onboarding/signup-age-check";
import { LAYER_CLASS } from "@/lib/ui/layers";
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
  birthYear?: string;
  form?: string;
};

type LearnerSignupStep = "track" | "credentials" | "emails";
type ValidationScope = "all" | "track" | "credentials" | "emails";

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

function guestSelectedTrack(
  session: ReturnType<typeof readUserSession>,
): MasteryCohort | null {
  if (!isGuestSession(session) || !session) return null;
  return parseMasteryCohort(session.curriculumCohort ?? session.ageTier);
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

  const trackFromQuery = parseMasteryCohort(searchParams.get("track"));
  const [cohort, setCohort] = useState<MasteryCohort | null>(() => {
    if (isParentMaster) return null;
    return trackFromQuery ?? guestSelectedTrack(existingSession);
  });
  const [learnerStep, setLearnerStep] = useState<LearnerSignupStep>("track");
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [ageFitMessage, setAgeFitMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
  const [isCreatingParentMaster, setIsCreatingParentMaster] = useState(false);
  const [approvalSavedUsername, setApprovalSavedUsername] = useState<string | null>(
    null,
  );
  const approvalEmailInFlightRef = useRef(false);
  const parentMasterInFlightRef = useRef(false);
  const skipSubmitRef = useRef(false);
  const isExplorerConsentFlow = parentMasterFlow === "explorer_consent";
  const isPathfinderClaimFlow = parentMasterFlow === "pathfinder_claim";

  useEffect(() => {
    if (isInternalPlaceholderUsername(username)) {
      setUsername("");
    }
  }, [username]);

  // SSR cannot read localStorage, so cohort starts null. Re-seed from the
  // guest session after mount or Explorer submit silently no-ops.
  useEffect(() => {
    if (isParentMaster || trackFromQuery) return;
    const track = guestSelectedTrack(readUserSession());
    if (!track) return;
    setCohort((current) => current ?? track);
  }, [isParentMaster, trackFromQuery]);

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

      const flow =
        pending.kind === "vpc"
          ? "explorer_consent"
          : pending.kind === "parent_claim"
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

  function collectValidationErrors(scope: ValidationScope = "all"): FormErrors {
    const next: FormErrors = {};
    const checkTrack = scope === "all" || scope === "track";
    const checkCredentials = scope === "all" || scope === "credentials";
    const checkEmails = scope === "all" || scope === "emails";
    const trimmedUsername = username.trim();

    if (checkCredentials) {
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

      if (!password) {
        next.password = "Create a password to secure your account.";
      } else if (password.trim().length < 6) {
        next.password = "Use at least 6 characters for your password.";
      }

      if (isParentMaster) {
        if (!confirmPassword) {
          next.confirmPassword = "Confirm your password.";
        } else if (password && confirmPassword !== password) {
          next.confirmPassword = "Passwords don't match.";
        }
      }
    }

    if (!isParentMaster && checkTrack) {
      if (!cohort) {
        next.track = "Pick the learning track for this profile.";
      }
      if (birthYear == null) {
        next.birthYear = "Choose the year you were born.";
      }
    }

    if (checkEmails && isExplorer) {
      const trimmedParent = parentEmail.trim().toLowerCase();
      if (!trimmedParent) {
        next.parentEmail =
          "Enter a parent or guardian email so they can approve your account.";
      } else if (!EMAIL_PATTERN.test(trimmedParent)) {
        next.parentEmail = INVALID_EMAIL_ERROR;
      }
      // Pre-existing parent emails are allowed — multiple Explorers may share one.
    }

    if (checkEmails && (isPathfinder || isMaverick)) {
      const trimmedLearner = learnerEmail.trim().toLowerCase();
      if (!trimmedLearner) {
        next.learnerEmail = "Enter your email so we can save your account.";
      } else if (!EMAIL_PATTERN.test(trimmedLearner)) {
        next.learnerEmail = INVALID_EMAIL_ERROR;
      }
    }

    if (checkEmails && isPathfinder) {
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

    if (isParentMaster && checkEmails) {
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

    return next;
  }

  function focusLearnerStepForErrors(nextErrors: FormErrors) {
    if (nextErrors.track || nextErrors.birthYear) {
      setLearnerStep("track");
      return;
    }
    if (nextErrors.username || nextErrors.password) {
      setLearnerStep("credentials");
    }
  }

  /** Switches the track when the year does not fit. Returns false to stay put. */
  function applyAgeFit(): boolean {
    if (birthYear == null || !cohort) return false;
    const decision = decideLearnerAge(birthYear);
    if (!decision) {
      setErrors((prev) => ({
        ...prev,
        birthYear: "Choose the year you were born.",
      }));
      setLearnerStep("track");
      return false;
    }
    if (decision.cohort !== cohort) {
      setCohort(decision.cohort);
      setAgeFitMessage(ageTrackFitMessage(decision.cohort));
      setLearnerStep("track");
      return false;
    }
    setAgeFitMessage(null);
    return true;
  }

  function handleTrackPick(track: MasteryCohort) {
    if (track === cohort) return;
    const decision = birthYear == null ? null : decideLearnerAge(birthYear);
    if (decision && decision.cohort !== track) {
      setCohort(decision.cohort);
      setAgeFitMessage(ageTrackFitMessage(decision.cohort));
    } else {
      setCohort(track);
      if (decision) setAgeFitMessage(null);
    }
    clearError("track");
  }

  function handleBirthYearChange(year: number | null) {
    setBirthYear(year);
    clearError("birthYear");
    if (year == null) {
      setAgeFitMessage(null);
      return;
    }
    const decision = decideLearnerAge(year);
    if (decision && cohort && decision.cohort !== cohort) {
      setCohort(decision.cohort);
      setAgeFitMessage(ageTrackFitMessage(decision.cohort));
      return;
    }
    setAgeFitMessage(null);
  }

  function handleLearnerBack() {
    if (learnerStep === "emails") {
      setLearnerStep("credentials");
      setErrors({});
      return;
    }
    if (learnerStep === "credentials") {
      setLearnerStep("track");
      setErrors({});
      return;
    }
    if (fromAccount) {
      router.push(DASHBOARD_SETTINGS_ACCOUNT_PATH);
      return;
    }
    if (fromLoginCreate) {
      router.push(`${ONBOARDING_SIGN_UP_PATH}?from=login`);
      return;
    }
    if (accountAs === "learner") {
      router.push(ONBOARDING_SIGN_UP_PATH);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

  function handleLearnerNext() {
    if (learnerStep === "track") {
      const nextErrors = collectValidationErrors("track");
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }
      if (!applyAgeFit()) return;
      // Replacing Next with the finish button can submit the form in the
      // same click. Ignore only that follow-up event.
      skipSubmitRef.current = true;
      queueMicrotask(() => {
        skipSubmitRef.current = false;
      });
      setErrors({});
      setLearnerStep("credentials");
      return;
    }
    if (learnerStep === "credentials") {
      const nextErrors = collectValidationErrors("credentials");
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }
      skipSubmitRef.current = true;
      queueMicrotask(() => {
        skipSubmitRef.current = false;
      });
      setErrors({});
      setLearnerStep("emails");
    }
  }

  function validate(): boolean {
    const next = collectValidationErrors();
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleParentMasterSubmit() {
    if (!consentToken || !pendingConsent || !parentMasterFlow || !validate()) {
      return;
    }
    if (parentMasterInFlightRef.current) return;
    parentMasterInFlightRef.current = true;
    setIsCreatingParentMaster(true);
    setErrors((prev) => ({ ...prev, form: undefined }));

    let succeeded = false;
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
        accountRole: "parent_master",
        curriculumCohort: "maverick",
        learnerEmail: result.parentEmail,
        password: password.trim(),
        accountStatus: "ACTIVE",
        marketingOptIn,
        supabaseUserId: result.parentId,
      });
      await finalizeRegisteredSignup(parentSession);
      if (isExplorerConsentFlow && result.createdNewParent) {
        markParentFirstWelcomePending(result.parentId);
      }
      succeeded = true;
      router.push(DASHBOARD_ACADEMY_PATH);
    } catch (error) {
      const message = resolveSignupFailureMessage(error, false);
      setErrors({
        form: /could not create your profile/i.test(message)
          ? "We could not create your parent master profile. Check your details and try again."
          : message,
      });
    } finally {
      if (!succeeded) {
        parentMasterInFlightRef.current = false;
        setIsCreatingParentMaster(false);
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (skipSubmitRef.current) {
      skipSubmitRef.current = false;
      return;
    }

    if (isParentMaster) {
      await handleParentMasterSubmit();
      return;
    }

    if (learnerStep !== "emails") {
      handleLearnerNext();
      return;
    }

    if (approvalEmailInFlightRef.current) return;

    let nextErrors: FormErrors = {};
    try {
      nextErrors = collectValidationErrors();
    } catch {
      setErrors({
        form: resolveSignupFailureMessage(new Error(""), isExplorer),
      });
      return;
    }

    if (!cohort) {
      nextErrors.track =
        nextErrors.track ?? "Pick the learning track for this profile.";
    }

    if (!cohort || Object.keys(nextErrors).length > 0) {
      focusLearnerStepForErrors(nextErrors);
      setErrors({
        ...nextErrors,
        form:
          nextErrors.form ??
          "Check the highlighted fields and try again.",
      });
      return;
    }

    if (!applyAgeFit()) return;

    approvalEmailInFlightRef.current = true;
    setIsSendingApprovalEmail(true);
    setErrors((prev) => ({ ...prev, form: undefined }));

    let succeeded = false;
    try {
      const result = await createSupabaseAccount({
        username: username.trim(),
        cohort,
        birthYear: birthYear ?? undefined,
        password: password.trim(),
        learnerEmail: isPathfinder || isMaverick ? learnerEmail.trim() : undefined,
        parentEmail: isExplorer || isPathfinder ? parentEmail.trim() : undefined,
        marketingOptIn: isExplorer ? false : marketingOptIn,
      });

      if (!result.success) {
        if (/username is already taken/i.test(result.error)) {
          setLearnerStep("credentials");
          setErrors((prev) => ({
            ...prev,
            username: USERNAME_TAKEN_ERROR,
            form: undefined,
          }));
          return;
        }
        if (/year you were born/i.test(result.error)) {
          setLearnerStep("track");
          setErrors((prev) => ({
            ...prev,
            birthYear: "Choose the year you were born.",
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

      const savedCohort = result.cohort;
      const isPendingConsent =
        result.accountStatus === "pending_consent" || savedCohort === "explorer";
      const childSession = convertToRegisteredProfile({
        username: result.username,
        accountRole: "child",
        parentEmail:
          savedCohort === "maverick" ? undefined : parentEmail.trim(),
        learnerEmail:
          savedCohort === "explorer" ? undefined : learnerEmail.trim(),
        password: password.trim(),
        accountStatus: isPendingConsent ? "PENDING_CONSENT" : "ACTIVE",
        marketingOptIn: savedCohort === "explorer" ? false : marketingOptIn,
        supabaseUserId: result.userId,
        curriculumCohort: savedCohort,
      });
      await finalizeRegisteredSignup(childSession, { skipEmail: true });
      succeeded = true;

      if (isPendingConsent) {
        markExplorerPendingPlayAllowed();
        router.push(`${ONBOARDING_SIGN_UP_PENDING_PATH}?from=signup`);
        return;
      }

      router.replace(DASHBOARD_ACADEMY_PATH);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: resolveSignupFailureMessage(error, isExplorer),
      }));
    } finally {
      if (!succeeded) {
        approvalEmailInFlightRef.current = false;
        setIsSendingApprovalEmail(false);
      }
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
                  errors.username && "border-[#031F82] focus:border-[#031F82]",
                )}
              />
              {errors.username ? (
                <p
                  className="font-sans text-sm font-medium text-[#031F82]"
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
                  errors.password && "border-[#031F82] focus:border-[#031F82]",
                )}
              />
              {errors.password ? (
                <p
                  className="font-sans text-sm font-medium text-[#031F82]"
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
                  errors.confirmPassword && "border-[#031F82] focus:border-[#031F82]",
                )}
              />
              {errors.confirmPassword ? (
                <p
                  className="font-sans text-sm font-medium text-[#031F82]"
                  role="alert"
                >
                  {errors.confirmPassword}
                </p>
              ) : null}
            </div>

            {errors.form ? (
              <div className="space-y-3">
                <p
                  className="font-sans text-sm font-medium text-[#031F82]"
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
                    className="font-sans text-sm font-medium text-[#031F82]"
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
              disabled={
                isCreatingParentMaster ||
                (isExplorerConsentFlow && !parentalConsentGiven)
              }
              aria-busy={isCreatingParentMaster || undefined}
            >
              {isCreatingParentMaster
                ? "Setting up your account…"
                : "Create Master Profile"}
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
          <OnboardingProgress value={25} />
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

  const learnerProgress =
    learnerStep === "track" ? 50 : learnerStep === "credentials" ? 75 : 100;
  const accountTitle = fromLoginCreate
    ? "Create your account"
    : ageTier
      ? cohortHeader(ageTier)
      : "Save Your Progress";
  const nextDisabled = learnerStep === "track" && !cohort;

  return (
    <section
      data-signup-step={learnerStep}
      className="flex flex-1 flex-col py-6 sm:py-10"
    >
      <div className="mx-auto w-full max-w-md space-y-6 pb-[calc(104px+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLearnerBack}
            aria-label="Back"
            className="font-heading text-sm font-bold text-nga-secondary transition-colors hover:text-nga-primary"
          >
            ←
          </button>
          <OnboardingProgress value={learnerProgress} className="min-w-0 flex-1" />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
            {learnerStep === "track"
              ? "Pick the path that matches your age."
              : accountTitle}
          </h1>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          {learnerStep === "track" ? (
            <>
              <LearnerTrackCards
                value={cohort}
                onChange={handleTrackPick}
                error={errors.track}
              />
              <LearnerBirthYearField
                value={birthYear}
                onChange={handleBirthYearChange}
                error={errors.birthYear}
                fitMessage={ageFitMessage}
              />
            </>
          ) : null}

          {learnerStep === "credentials" ? (
            <>
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
                  className={learnerFieldClass}
                />
                {errors.username ? (
                  <p
                    className="font-sans text-sm font-medium text-[#031F82]"
                    role="alert"
                  >
                    {errors.username}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="signup-password"
                  className="block font-heading text-sm font-bold text-nga-primary"
                >
                  Create your password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError("password");
                    }}
                    aria-invalid={Boolean(errors.password)}
                    className={cn(learnerFieldClass, "pr-16")}
                  />
                  <button
                    type="button"
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-3 font-heading text-sm font-bold text-nga-primary"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password ? (
                  <p
                    className="font-sans text-sm font-medium text-[#031F82]"
                    role="alert"
                  >
                    {errors.password}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}

          {learnerStep === "emails" ? (
            <>
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
                    className={learnerFieldClass}
                  />
                  {errors.learnerEmail ? (
                    <p
                      className="font-sans text-sm font-medium text-[#031F82]"
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
                    className={learnerFieldClass}
                  />
                  {errors.parentEmail ? (
                    <p
                      className="font-sans text-sm font-medium text-[#031F82]"
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

              {isExplorer ? null : (
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-[#E5E5E5] accent-[#031F82]"
                  />
                  <span className="font-sans text-sm leading-relaxed text-nga-slate">
                    Send me occasional updates about NextGenAchiever$
                  </span>
                </label>
              )}
            </>
          ) : null}

          {errors.form ? (
            <p className="font-sans text-sm font-medium text-[#031F82]" role="alert">
              {errors.form}
            </p>
          ) : null}

          <div
            className={cn(
              "fixed inset-x-0 bottom-0 bg-white px-6 pt-3 pb-[max(20px,env(safe-area-inset-bottom))]",
              LAYER_CLASS.chrome,
            )}
          >
            <div className="mx-auto w-full max-w-md">
              {learnerStep === "emails" ? (
                <Button
                  key="signup-finish"
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
              ) : (
                <Button
                  key="signup-next"
                  type="button"
                  variant="cta"
                  fullWidth
                  disabled={nextDisabled}
                  onClick={handleLearnerNext}
                  className="disabled:!border-b-0 disabled:!opacity-45 disabled:!shadow-none"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
