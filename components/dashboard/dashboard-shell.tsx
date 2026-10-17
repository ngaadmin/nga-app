"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation";
import {
  DashboardNavPendingProvider,
  DashboardPendingScreen,
} from "@/components/dashboard/dashboard-nav-pending";
import { AppFooter } from "@/components/legal/app-footer";
import { DashboardStatusHeader } from "@/components/dashboard/dashboard-status-header";
import { HubIntro } from "@/components/dashboard/hub-intro/hub-intro";
import { hubIntroIdFromPathname } from "@/lib/dashboard/hub-intro/resolve-hub";
import { isDevAcademyDesignShellPath } from "@/lib/academy/lessons/lesson-availability";
import {
  ONBOARDING_ENTRY_PATH,
  readUserSession,
  hasCompletedPersonalizationGate,
} from "@/lib/onboarding/guest-session";
import { syncLocalSessionWithSupabaseAccount } from "@/lib/onboarding/sync-registered-session";
import { cn } from "@/lib/utils/cn";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isLessonRoute = pathname.startsWith("/dashboard/academy/lesson/");
  const hubIntroId = isLessonRoute ? null : hubIntroIdFromPathname(pathname);
  const skipOnboardingGate = isDevAcademyDesignShellPath(pathname);

  useEffect(() => {
    if (skipOnboardingGate) return;

    let cancelled = false;

    async function gateDashboard() {
      if (hasCompletedPersonalizationGate(readUserSession())) return;

      const synced = await syncLocalSessionWithSupabaseAccount();
      if (cancelled) return;

      const session = synced ?? readUserSession();
      if (hasCompletedPersonalizationGate(session)) return;

      router.replace(ONBOARDING_ENTRY_PATH);
    }

    void gateDashboard();
    return () => {
      cancelled = true;
    };
  }, [router, skipOnboardingGate]);

  return (
    <DashboardNavPendingProvider>
      <div
        className={cn(
          "flex h-dvh max-h-dvh w-full max-w-full flex-col overflow-hidden bg-white",
          "print:h-auto print:max-h-none print:overflow-visible",
        )}
      >
      {isLessonRoute ? null : <DashboardNavigation />}

      <div
        className={cn(
          "flex min-h-0 w-full max-w-full flex-1 flex-col overflow-hidden md:pl-64 print:overflow-visible print:md:pl-0",
        )}
        {...(!isLessonRoute ? { "data-dashboard-hub": true } : {})}
      >
        {!isLessonRoute ? <DashboardStatusHeader /> : null}

        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-x-hidden",
            isLessonRoute
              ? "overflow-hidden px-0 py-0"
              : "overflow-y-auto overscroll-y-contain px-4 py-6 pb-[calc(112px+env(safe-area-inset-bottom))] sm:px-6 md:pb-8 print:overflow-visible print:p-0",
          )}
        >
          <DashboardPendingScreen>
            {hubIntroId ? <HubIntro hubId={hubIntroId} /> : null}
            {children}
            {isLessonRoute ? null : <AppFooter className="mt-8 print:hidden" />}
          </DashboardPendingScreen>
        </main>
      </div>
      </div>
    </DashboardNavPendingProvider>
  );
}
