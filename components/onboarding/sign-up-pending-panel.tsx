"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { ExplorerPendingConsentView } from "@/components/onboarding/explorer-pending-consent-view";
import { useAccountProgressSync } from "@/lib/dashboard/account-progress-sync";
import { useSupabaseAccountSync } from "@/lib/dashboard/use-supabase-account-sync";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import { isExplorerPendingConsent } from "@/lib/onboarding/explorer-pending-consent";
import {
  DASHBOARD_ACADEMY_PATH,
  ONBOARDING_SIGN_IN_PATH,
} from "@/lib/onboarding/guest-session";

export function SignUpPendingPanel() {
  const router = useRouter();
  useSupabaseAccountSync({ intervalMs: 8000 });
  useAccountProgressSync();
  const session = useUserSession();
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (!session) return;

    if (session.accessMode !== "registered") {
      router.replace(ONBOARDING_SIGN_IN_PATH);
      return;
    }

    if (session.accountStatus === "ACTIVE") {
      setApproved(true);
      return;
    }

    if (!isExplorerPendingConsent(session)) {
      router.replace(DASHBOARD_ACADEMY_PATH);
    }
  }, [router, session]);

  return (
    <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md space-y-8 px-1">
        <OnboardingProgress value={approved ? 100 : 75} />
        <ExplorerPendingConsentView approved={approved} session={session} />
      </div>
    </section>
  );
}
