"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { parentMasterSignUpHref } from "@/lib/onboarding/guest-session";
import {
  lookupConsentToken,
  resendParentConsentApproval,
  type PendingParentConsent,
} from "@/lib/onboarding/parent-consent-pending";

type ApprovalState = "loading" | "expired" | "error" | "resent";

/**
 * Legacy `/onboarding/parent-consent?token=` links and expired-token resend.
 * Valid tokens skip this screen and go straight to parent master signup.
 */
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
          setState("error");
        }
        return;
      }

      const lookup = await lookupConsentToken(token);
      if (cancelled) return;

      if (lookup.status === "valid") {
        router.replace(parentMasterSignUpHref(token));
        return;
      }

      if (lookup.status === "expired") {
        setPending(lookup.pending);
        setErrorMessage(null);
        setState("expired");
        return;
      }

      setPending(null);
      setErrorMessage("We could not open this approval link. Please try again.");
      setState("error");
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router, token]);

  async function handleResend() {
    if (!token || resendInFlightRef.current) return;

    resendInFlightRef.current = true;
    setIsResending(true);
    setErrorMessage(null);

    try {
      const result = await resendParentConsentApproval(token);
      setPending((current) =>
        current
          ? {
              ...current,
              token: result.token,
              childUsername: result.childUsername,
              parentEmail: result.parentEmail ?? current.parentEmail,
              createdAt: new Date().toISOString(),
            }
          : {
              token: result.token,
              parentEmail: result.parentEmail ?? "",
              childUsername: result.childUsername,
              birthYear: 0,
              createdAt: new Date().toISOString(),
            },
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
          <p className="font-sans text-base text-nga-slate">
            Opening parent setup…
          </p>
        </div>
      </section>
    );
  }

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
