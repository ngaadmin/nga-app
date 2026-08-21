"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { copyMatrix } from "@/constants/copyMatrix";
import { persistRegisteredProgressNow } from "@/lib/dashboard/account-progress-sync";
import { clearAllAppSessionState } from "@/lib/onboarding/clear-app-session-state";
import {
  DASHBOARD_ACADEMY_PATH,
  ONBOARDING_SIGN_IN_PATH,
  type UserSession,
} from "@/lib/onboarding/guest-session";
import {
  findLocalPendingForUsername,
  resendParentConsentApproval,
} from "@/lib/onboarding/parent-consent-pending";
import { resendExplorerPendingApprovalEmail } from "@/lib/onboarding/resend-explorer-pending-approval";

type ExplorerPendingConsentViewProps = {
  approved: boolean;
  session: UserSession | null;
};

export function ExplorerPendingConsentView({
  approved,
  session,
}: ExplorerPendingConsentViewProps) {
  const router = useRouter();
  const copy = copyMatrix.onboarding.pendingConsent;
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const resendInFlightRef = useRef(false);

  async function leaveToLogin() {
    if (isLeaving) return;
    setIsLeaving(true);
    await persistRegisteredProgressNow();
    clearAllAppSessionState();
    router.push(ONBOARDING_SIGN_IN_PATH);
  }

  async function handleResend() {
    if (resendInFlightRef.current) return;
    resendInFlightRef.current = true;
    setIsResending(true);
    setError(null);

    try {
      const localToken = session?.username
        ? findLocalPendingForUsername(session.username)?.token
        : null;
      if (localToken) {
        try {
          await resendParentConsentApproval(localToken);
          await leaveToLogin();
          return;
        } catch {
          // Fall through to the signed-in child resend path.
        }
      }

      const result = await resendExplorerPendingApprovalEmail();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await leaveToLogin();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not resend the approval email. Please try again shortly.",
      );
    } finally {
      resendInFlightRef.current = false;
      setIsResending(false);
    }
  }

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-3">
        <h1
          id="explorer-pending-heading"
          className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]"
        >
          {approved ? copy.headingApproved : copy.heading}
        </h1>
        <p
          id="explorer-pending-body"
          className="font-sans text-sm leading-relaxed text-nga-ink sm:text-base"
        >
          {approved ? copy.bodyApproved : copy.body}
        </p>
      </div>

      {error ? (
        <p className="font-sans text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        {approved ? (
          <Button
            type="button"
            variant="cta"
            fullWidth
            onClick={() => router.push(DASHBOARD_ACADEMY_PATH)}
          >
            {copy.continue}
          </Button>
        ) : (
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
            {isResending ? copy.resending : copy.resend}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          fullWidth
          onClick={() => {
            void leaveToLogin();
          }}
          disabled={isLeaving}
        >
          {copy.logOut}
        </Button>
      </div>
    </div>
  );
}
