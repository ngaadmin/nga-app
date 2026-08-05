"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { Button, ButtonLink } from "@/components/ui/button";
import { requestOnboardingEmailSend } from "@/lib/email/request-send";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/guest-session";
import {
  buildParentConsentApprovalPath,
  readPendingParentConsent,
} from "@/lib/onboarding/parent-consent-pending";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 1);
  return `${visible}${"•".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

export function SignUpPendingPanel() {
  const searchParams = useSearchParams();
  const parentEmailFromQuery = searchParams.get("email") ?? "";
  const approvalPathFromQuery = searchParams.get("approval") ?? "";
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const pending = useMemo(() => readPendingParentConsent(), []);
  const parentEmail = parentEmailFromQuery || pending?.parentEmail || "";
  const approvalPath =
    approvalPathFromQuery ||
    (pending ? buildParentConsentApprovalPath(pending.token) : "");

  async function handleResend() {
    const existing = readPendingParentConsent();
    if (!existing) {
      setResendMessage(
        "We could not find a pending approval. Restart signup to send a new email.",
      );
      return;
    }

    setIsResending(true);
    setResendMessage(null);
    try {
      const result = await requestOnboardingEmailSend({
        type: "EXPLORER_PARENT",
        recipientEmail: existing.parentEmail,
        data: {
          username: existing.childUsername,
          token: existing.token,
        },
      });

      if (result.success) {
        setResendMessage("Approval email re-sent!");
      } else {
        setResendMessage(
          "We could not resend the approval email. Try again in a moment.",
        );
      }
    } catch {
      setResendMessage(
        "We could not resend the approval email. Try again in a moment.",
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md space-y-8 px-1">
        <OnboardingProgress value={75} />

        <div className="space-y-3 text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
            Progress saved locally! Next step: Ask your parent
          </h1>
        </div>

        <div className="space-y-4 rounded-nga-lg border-2 border-[#BDE9FB] bg-[#BDE9FB]/15 px-4 py-4 font-sans text-sm leading-relaxed text-nga-ink">
          <p>
            We sent an approval link to{" "}
            {parentEmail ? (
              <span className="font-semibold text-nga-primary">
                {maskEmail(parentEmail)}
              </span>
            ) : (
              "your parent or guardian"
            )}
            . You can keep playing on this device right now! Once your parent or
            guardian clicks the email link, your progress will be saved
            automatically.
          </p>
          {approvalPath ? (
            <p className="text-xs text-nga-slate">
              Dev preview:{" "}
              <Link
                href={approvalPath}
                className="font-semibold text-nga-secondary underline-offset-4 hover:underline"
              >
                Open parent approval link
              </Link>
            </p>
          ) : null}
        </div>

        {resendMessage ? (
          <p
            className="text-center font-sans text-sm font-medium text-nga-primary"
            role="status"
          >
            {resendMessage}
          </p>
        ) : null}

        <div className="space-y-3">
          <ButtonLink href={DASHBOARD_ACADEMY_PATH} variant="cta" fullWidth>
            Keep Playing in the App
          </ButtonLink>
          <Button
            type="button"
            variant="secondary-outline"
            fullWidth
            disabled={isResending}
            onClick={() => {
              void handleResend();
            }}
          >
            {isResending ? "Resending…" : "Resend Approval Email"}
          </Button>
        </div>
      </div>
    </section>
  );
}
