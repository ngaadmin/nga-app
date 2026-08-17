"use client";

import { useEffect, useState } from "react";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { ButtonLink } from "@/components/ui/button";
import { useSupabaseAccountSync } from "@/lib/dashboard/use-supabase-account-sync";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/guest-session";

export function SignUpPendingPanel() {
  useSupabaseAccountSync({ intervalMs: 8000 });
  const session = useUserSession();
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (
      session?.accessMode === "registered" &&
      session.accountStatus === "ACTIVE" &&
      session.consentApprovedAt
    ) {
      setApproved(true);
    }
  }, [session]);

  return (
    <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md space-y-8 px-1">
        <OnboardingProgress value={approved ? 100 : 75} />

        <div className="space-y-3 text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
            {approved
              ? "Your profile is approved!"
              : "Approval request has been sent!"}
          </h1>
          <p className="font-sans text-sm leading-relaxed text-nga-ink sm:text-base">
            {approved
              ? "Your parent or guardian approved your account. Your progress is saved - keep playing whenever you want."
              : "You can keep playing on this device right now. Once your parent or guardian approves your account, your progress will be saved automatically."}
          </p>
        </div>

        <div className="space-y-3">
          <ButtonLink href={DASHBOARD_ACADEMY_PATH} variant="cta" fullWidth>
            {approved ? "Continue in the app" : "Keep playing in the app now"}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
