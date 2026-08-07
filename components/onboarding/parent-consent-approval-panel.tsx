"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { Button } from "@/components/ui/button";
import {
  getMasteryCohortFromBirthYear,
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
} from "@/lib/dashboard/mastery-cohort";
import {
  DASHBOARD_ACADEMY_PATH,
  saveUserSession,
  type UserSession,
} from "@/lib/onboarding/guest-session";
import {
  approveParentConsent,
  lookupConsentToken,
  resendParentConsentApproval,
  type PendingParentConsent,
} from "@/lib/onboarding/parent-consent-pending";
import { findActiveParentMasterByEmail } from "@/lib/onboarding/registered-accounts";

type ApprovalState =
  | "loading"
  | "ready"
  | "approving"
  | "expired"
  | "error"
  | "resent";

export function ParentConsentApprovalPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") ?? "").trim();

  const [state, setState] = useState<ApprovalState>("loading");
  const [pending, setPending] = useState<PendingParentConsent | null>(null);
  const [existingMaster, setExistingMaster] = useState<UserSession | null>(
    null,
  );
  const [parentalConsentGiven, setParentalConsentGiven] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const resendInFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) {
        if (!cancelled) {
          setPending(null);
          setExistingMaster(null);
          setErrorMessage("This approval link is missing or incomplete.");
          setState("error");
        }
        return;
      }

      const lookup = await lookupConsentToken(token);
      if (cancelled) return;

      if (lookup.status === "valid") {
        setPending(lookup.pending);
        setExistingMaster(
          findActiveParentMasterByEmail(lookup.pending.parentEmail),
        );
        setErrorMessage(null);
        setState("ready");
        return;
      }

      // Genuine TTL expiry only — never host/signature mismatch.
      if (lookup.status === "expired") {
        setPending(lookup.pending);
        setExistingMaster(null);
        setErrorMessage(null);
        setState("expired");
        return;
      }

      // Recoverable signature failures: offer resend without the expiry page.
      if (lookup.status === "recoverable") {
        setPending(lookup.pending);
        setExistingMaster(null);
        setErrorMessage(
          "We could not verify this approval link. Resend a fresh email for the same pending profile.",
        );
        setState("error");
        return;
      }

      setPending(null);
      setExistingMaster(null);
      setErrorMessage("We could not open this approval link. Please try again.");
      setState("error");
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function handleContinueToMasterProfile() {
    if (!token || !pending || state !== "ready" || existingMaster) return;
    // Do not approve here — consent is confirmed on the Create Master Profile form.
    router.push(
      `/onboarding/sign-up?role=parent_master&token=${encodeURIComponent(token)}`,
    );
  }

  async function handleApproveForExistingMaster() {
    if (
      !token ||
      !pending ||
      !existingMaster ||
      !parentalConsentGiven ||
      state === "approving"
    ) {
      return;
    }

    setState("approving");
    setErrorMessage(null);

    try {
      const childSession = await approveParentConsent(token);
      if (!childSession) {
        setErrorMessage(
          "We could not approve this profile. The consent link may have expired.",
        );
        setState("error");
        return;
      }

      // Keep the existing master signed in after linking the new learner.
      saveUserSession(existingMaster);
      router.push(DASHBOARD_ACADEMY_PATH);
    } catch {
      setErrorMessage(
        "Something went wrong while approving. Please try again, or resend a fresh approval email.",
      );
      setState("error");
    }
  }

  async function handleResend() {
    if (!token || resendInFlightRef.current) return;

    resendInFlightRef.current = true;
    setIsResending(true);
    setErrorMessage(null);

    try {
      const nextPending = await resendParentConsentApproval(token);
      setPending(nextPending);
      setExistingMaster(
        findActiveParentMasterByEmail(nextPending.parentEmail),
      );
      setState("resent");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not resend the approval email. Please try again shortly.",
      );
      setState((current) =>
        current === "resent" || current === "expired" ? current : "error",
      );
    } finally {
      resendInFlightRef.current = false;
      setIsResending(false);
    }
  }

  if (state === "loading") {
    return (
      <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
        <div className="mx-auto w-full max-w-md px-1 text-center">
          <p className="font-sans text-base text-nga-slate">Loading approval…</p>
        </div>
      </section>
    );
  }

  // Expiry-only page: shown solely when the 24h TTL has elapsed.
  if (state === "expired" || state === "resent") {
    return (
      <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
        <div className="mx-auto w-full max-w-md space-y-6 px-1 text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
            {state === "resent"
              ? "Approval email sent again"
              : "This approval link is not valid"}
          </h1>
          <p className="font-sans text-base leading-relaxed text-nga-slate">
            {state === "resent"
              ? `We sent a fresh approval link to the parent email on file${
                  pending?.childUsername
                    ? ` for ${pending.childUsername}`
                    : ""
                }. Check your inbox and use the newest email.`
              : `This link is older than 24 hours${
                  pending?.childUsername
                    ? ` for ${pending.childUsername}`
                    : ""
                }. Resend a fresh approval email for the same pending profile.`}
          </p>
          {errorMessage ? (
            <p
              className="font-sans text-sm font-medium text-red-600"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}
          {state !== "resent" ? (
            <Button
              type="button"
              variant="cta"
              fullWidth
              onClick={() => {
                void handleResend();
              }}
              disabled={isResending}
              aria-busy={isResending || undefined}
            >
              {isResending ? "Sending…" : "Resend approval email"}
            </Button>
          ) : null}
        </div>
      </section>
    );
  }

  if (state === "error") {
    const canResend = Boolean(pending) && Boolean(token);
    return (
      <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
        <div className="mx-auto w-full max-w-md space-y-6 px-1 text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
            Approval could not be completed
          </h1>
          <p className="font-sans text-base leading-relaxed text-nga-slate">
            {errorMessage ??
              "Something went wrong with this approval link. Please try again."}
          </p>
          {canResend ? (
            <Button
              type="button"
              variant="cta"
              fullWidth
              onClick={() => {
                void handleResend();
              }}
              disabled={isResending}
              aria-busy={isResending || undefined}
            >
              {isResending ? "Sending…" : "Resend approval email"}
            </Button>
          ) : null}
        </div>
      </section>
    );
  }

  const learnerCohort = pending
    ? getMasteryCohortFromBirthYear(pending.birthYear)
    : null;
  const cohortLabel = learnerCohort
    ? masteryCohortLabel(learnerCohort)
    : "Explorer";
  const ageRangeLabel =
    learnerCohort === "explorer" || !learnerCohort
      ? "12 and under"
      : masteryCohortAgeRangeLabel(learnerCohort);
  const hasExistingMaster = Boolean(existingMaster);

  return (
    <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md space-y-8 px-1">
        <OnboardingProgress value={75} />

        <div className="space-y-3 text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
            Parent / Guardian Consent
          </h1>
          <p className="font-sans text-base leading-relaxed text-nga-slate sm:text-lg">
            You&apos;ve been asked to approve a free NextGenAchiever$ profile
            for:
          </p>
        </div>

        <div className="rounded-nga-lg border-2 border-nga-panel bg-nga-mist/40 px-4 py-5 text-center">
          <p className="font-heading text-xs font-bold uppercase tracking-wide text-nga-slate">
            Learner username
          </p>
          <p className="mt-2 font-heading text-xl font-extrabold leading-tight text-nga-primary sm:text-2xl">
            {pending?.childUsername}
          </p>
          <p className="mt-3 font-sans text-base leading-relaxed text-nga-slate sm:text-lg">
            Your child has been entered into the {cohortLabel} track for kids
            aged {ageRangeLabel}. You can change this in the Settings section of
            the app.
          </p>
        </div>

        <div className="space-y-4 font-sans text-base leading-relaxed text-nga-ink sm:text-lg">
          <p>
            NextGenAchiever$ is the leading app for teaching kids essential
            money skills through games and hands-on business building
            activities.
          </p>
          <p>
            We take the protection of minors online very seriously and follow
            all applicable rules for users under 13 and under 16.
          </p>
          <p>
            {hasExistingMaster
              ? "Confirm your consent below to link this learner to your existing master account. You can track their progress and delete accounts at any time."
              : "Please create a master account and confirm that you consent to your child using the app. Your master account lets you track their progress and delete your - and your child's - accounts at any time."}
          </p>
        </div>

        {errorMessage ? (
          <p
            className="font-sans text-sm font-medium text-red-600"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        {hasExistingMaster ? (
          <div className="space-y-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={parentalConsentGiven}
                onChange={(e) => setParentalConsentGiven(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-[#E5E5E5] text-nga-primary focus:ring-nga-secondary"
              />
              <span className="font-sans text-base leading-relaxed text-nga-ink">
                I am the parent or legal guardian of{" "}
                <span className="font-semibold text-nga-primary">
                  {pending?.childUsername}
                </span>
                , and I approve their NextGenAchiever$ profile.{" "}
                <span className="font-semibold text-nga-primary">(Required)</span>
              </span>
            </label>
            <Button
              type="button"
              variant="cta"
              fullWidth
              disabled={!parentalConsentGiven || state === "approving"}
              onClick={() => {
                void handleApproveForExistingMaster();
              }}
            >
              {state === "approving" ? "Approving…" : "Approve profile"}
            </Button>
            <p className="text-center font-sans text-sm leading-relaxed text-nga-slate">
              This learner will be linked to your existing master account
              {existingMaster?.username ? ` (${existingMaster.username})` : ""}.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              type="button"
              variant="cta"
              fullWidth
              onClick={handleContinueToMasterProfile}
            >
              Create Master Profile
            </Button>
            <p className="text-center font-sans text-sm leading-relaxed text-nga-slate">
              Next: create your parent master login and confirm consent.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
