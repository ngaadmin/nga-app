"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { LockedBirthYearSummary } from "@/components/onboarding/locked-birth-year-summary";
import {
  approveParentConsent,
  readPendingParentConsentByToken,
} from "@/lib/onboarding/parent-consent-pending";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/guest-session";

const EMAIL_HELPER_TEXT =
  "Your email stays private and is never used for marketing unless you give us permission.";

type ApprovalState = "loading" | "ready" | "approved" | "invalid";

export function ParentConsentApprovalPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<ApprovalState>("loading");
  const pending = token ? readPendingParentConsentByToken(token) : null;

  useEffect(() => {
    if (!token || !pending) {
      setState("invalid");
      return;
    }
    setState("ready");
  }, [pending, token]);

  function handleApprove() {
    if (!token) return;
    const session = approveParentConsent(token);
    if (!session) {
      setState("invalid");
      return;
    }
    setState("approved");
    router.push(DASHBOARD_ACADEMY_PATH);
  }

  if (state === "invalid") {
    return (
      <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
        <div className="mx-auto w-full max-w-md space-y-6 px-1 text-center">
          <h1 className="font-heading text-2xl font-extrabold text-nga-primary">
            This consent link expired
          </h1>
          <p className="font-sans text-sm text-nga-slate">
            Ask your Explorer to restart signup so we can send a fresh parent
            email.
          </p>
          <ButtonLink href="/onboarding/sign-up" variant="secondary-outline" fullWidth>
            Back to signup
          </ButtonLink>
        </div>
      </section>
    );
  }

  if (!pending) {
    return null;
  }

  return (
    <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md space-y-8 px-1">
        <OnboardingProgress value={100} />

        <div className="space-y-3 text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary">
            Parent consent
          </h1>
          <p className="font-sans text-sm leading-relaxed text-nga-slate">
            You&apos;re approving a free NextGenAchievers profile for{" "}
            <span className="font-semibold text-nga-primary">
              {pending.childUsername}
            </span>
            . You&apos;ll own the master account; their progress is saved once
            you approve.
          </p>
        </div>

        <div className="rounded-nga-lg border-2 border-nga-panel bg-nga-mist/30 px-4 py-3 font-sans text-sm text-nga-ink">
          <p>
            Master Account Email Address:{" "}
            <span className="font-semibold">{pending.parentEmail}</span>
          </p>
          <p className="mt-2 text-nga-slate">
            You can review their activity through the parent dashboard in a
            later release.
          </p>
        </div>

        <LockedBirthYearSummary
          birthYear={pending.birthYear}
          parentConsent
        />

        <p className="font-sans text-sm italic leading-relaxed text-nga-slate text-center">
          {EMAIL_HELPER_TEXT}
        </p>

        <Button type="button" variant="cta" fullWidth onClick={handleApprove}>
          Approve &amp; Create Profile
        </Button>
      </div>
    </section>
  );
}
