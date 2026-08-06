"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  readPendingParentConsentByToken,
  type PendingParentConsent,
} from "@/lib/onboarding/parent-consent-pending";

type ApprovalState = "loading" | "ready" | "invalid";

export function ParentConsentApprovalPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") ?? "").trim();

  const [state, setState] = useState<ApprovalState>("loading");
  const [pending, setPending] = useState<PendingParentConsent | null>(null);

  useEffect(() => {
    if (!token) {
      setPending(null);
      setState("invalid");
      return;
    }

    const resolved = readPendingParentConsentByToken(token);
    if (!resolved) {
      setPending(null);
      setState("invalid");
      return;
    }

    setPending(resolved);
    setState("ready");
  }, [token]);

  function handleApprove() {
    if (!token || !pending) return;
    router.push(
      `/onboarding/sign-up?role=parent_master&token=${encodeURIComponent(token)}`,
    );
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

  if (state === "invalid" || !pending) {
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
                {pending.childUsername}
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

        <Button type="button" variant="cta" fullWidth onClick={handleApprove}>
          APPROVE AND CREATE MASTER PROFILE
        </Button>
      </div>
    </section>
  );
}
