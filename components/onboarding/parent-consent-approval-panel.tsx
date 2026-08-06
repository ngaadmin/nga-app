"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  approveParentConsent,
  lookupConsentToken,
  resendParentConsentApproval,
  type PendingParentConsent,
} from "@/lib/onboarding/parent-consent-pending";

type ApprovalState =
  | "loading"
  | "ready"
  | "approving"
  | "success"
  | "expired"
  | "invalid"
  | "error"
  | "resent";

const SUCCESS_NAV_DELAY_MS = 1100;

export function ParentConsentApprovalPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") ?? "").trim();

  const [state, setState] = useState<ApprovalState>("loading");
  const [pending, setPending] = useState<PendingParentConsent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const resendInFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) {
        if (!cancelled) {
          setPending(null);
          setErrorMessage("This approval link is missing or incomplete.");
          setState("invalid");
        }
        return;
      }

      const lookup = await lookupConsentToken(token);
      if (cancelled) return;

      if (lookup.status === "valid") {
        setPending(lookup.pending);
        setErrorMessage(null);
        setState("ready");
        return;
      }

      if (lookup.status === "expired") {
        setPending(lookup.pending);
        setErrorMessage(null);
        setState("expired");
        return;
      }

      setPending(null);
      setErrorMessage(
        "This approval link is no longer valid. You can ask your learner to resend approval from their device, or restart signup if needed.",
      );
      setState("invalid");
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (state !== "success" || !token) return;

    const timer = window.setTimeout(() => {
      router.push(
        `/onboarding/sign-up?role=parent_master&token=${encodeURIComponent(token)}`,
      );
    }, SUCCESS_NAV_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [router, state, token]);

  async function handleApprove() {
    if (!token || !pending || state === "approving" || state === "success") {
      return;
    }

    setState("approving");
    setErrorMessage(null);

    try {
      const childSession = await approveParentConsent(token);
      if (!childSession) {
        setErrorMessage(
          "We could not approve this profile. The consent link may be invalid or expired.",
        );
        setState("error");
        return;
      }
      setState("success");
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
      setState("resent");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not resend the approval email. Please try again shortly.",
      );
      setState((current) => (current === "resent" ? current : "expired"));
    } finally {
      resendInFlightRef.current = false;
      setIsResending(false);
    }
  }

  if (state === "loading") {
    return (
      <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
        <div className="mx-auto w-full max-w-md px-1 text-center">
          <p className="font-sans text-sm text-nga-slate">Loading approval…</p>
        </div>
      </section>
    );
  }

  if (state === "expired" || state === "resent") {
    return (
      <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
        <div className="mx-auto w-full max-w-md space-y-6 px-1 text-center">
          <h1 className="font-heading text-2xl font-extrabold text-nga-primary">
            {state === "resent"
              ? "Approval email sent again"
              : "This approval link has expired"}
          </h1>
          <p className="font-sans text-sm text-nga-slate">
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
                }. Resend a fresh approval email for the same pending profile — no need to create a new account.`}
          </p>
          {errorMessage ? (
            <p
              className="font-sans text-sm font-medium text-red-600"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}
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
        </div>
      </section>
    );
  }

  if (state === "invalid" || state === "error") {
    const canResend = Boolean(pending) && Boolean(token);
    return (
      <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
        <div className="mx-auto w-full max-w-md space-y-6 px-1 text-center">
          <h1 className="font-heading text-2xl font-extrabold text-nga-primary">
            {state === "invalid"
              ? "This approval link is not valid"
              : "Approval could not be completed"}
          </h1>
          <p className="font-sans text-sm text-nga-slate">
            {errorMessage ??
              "This approval link is no longer valid. Try resending a fresh approval email for the same pending profile."}
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
          ) : (
            <ButtonLink href="/onboarding/start?fresh=1" variant="cta" fullWidth>
              Restart signup
            </ButtonLink>
          )}
        </div>
      </section>
    );
  }

  if (state === "success" && pending) {
    return (
      <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
        <div className="mx-auto w-full max-w-md space-y-6 px-1 text-center">
          <OnboardingProgress value={100} />
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary">
            Consent approved
          </h1>
          <p className="font-sans text-sm leading-relaxed text-nga-slate sm:text-base">
            <span className="font-semibold text-nga-primary">
              {pending.childUsername}
            </span>
            &apos;s Explorer profile is approved.
          </p>
          <p className="font-sans text-sm leading-relaxed text-nga-ink sm:text-base">
            Next: create your parent master login.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md space-y-8 px-1">
        <OnboardingProgress value={100} />

        <div className="space-y-4 text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary">
            Parent/Guardian Consent
          </h1>
          <div className="space-y-3 font-sans text-sm leading-relaxed text-nga-ink sm:text-base">
            <p>
              You&apos;ve been asked to approve a free NextGenAchiever$ profile
              for{" "}
              <span className="font-semibold text-nga-primary">
                {pending?.childUsername}
              </span>
              .
            </p>
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
              In approving this profile, you will own the master account and can
              track your child&apos;s progress. You can also delete the account
              at any time.
            </p>
          </div>
        </div>

        {errorMessage ? (
          <p
            className="font-sans text-sm font-medium text-red-600"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <div className="space-y-2">
          <Button
            type="button"
            variant="cta"
            fullWidth
            onClick={() => {
              void handleApprove();
            }}
            disabled={state === "approving"}
          >
            {state === "approving"
              ? "Approving…"
              : "APPROVE AND CREATE MASTER PROFILE"}
          </Button>
          <p className="text-center font-sans text-xs leading-relaxed text-nga-slate sm:text-sm">
            Next: create your parent master login.
          </p>
        </div>
      </div>
    </section>
  );
}
