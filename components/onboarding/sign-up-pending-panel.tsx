"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { ButtonLink } from "@/components/ui/button";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/ghost-session";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 1);
  return `${visible}${"•".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

export function SignUpPendingPanel() {
  const searchParams = useSearchParams();
  const parentEmail = searchParams.get("email") ?? "";
  const approvalPath = searchParams.get("approval") ?? "";

  return (
    <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md space-y-8 px-1">
        <OnboardingProgress value={75} />

        <div className="space-y-3 text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
            Ask your parent/guardian to check their email
          </h1>
        </div>

        <div className="space-y-4 rounded-nga-lg border-2 border-[#BDE9FB] bg-[#BDE9FB]/15 px-4 py-4 font-sans text-sm leading-relaxed text-nga-ink">
          <p>
            We sent an email to{" "}
            {parentEmail ? (
              <span className="font-semibold text-nga-primary">
                {maskEmail(parentEmail)}
              </span>
            ) : (
              "your parent or guardian"
            )}
            . Once they tap approve, your profile will be saved, including the
            learning progress you&apos;ve made in this session. So jump right
            in!
          </p>
          <p className="font-heading text-sm font-bold text-nga-primary">
            Good news: Start playing while you wait for the approval. Your
            points, skills and lesson wins will stay saved as long as the app
            stays open.
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

        <ButtonLink href={DASHBOARD_ACADEMY_PATH} variant="cta" fullWidth>
          Start Playing Now!
        </ButtonLink>
      </div>
    </section>
  );
}
