"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation";
import { DashboardStatusHeader } from "@/components/dashboard/dashboard-status-header";
import { HubIntro } from "@/components/dashboard/hub-intro/hub-intro";
import { hubIntroIdFromPathname } from "@/lib/dashboard/hub-intro/resolve-hub";
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

  useEffect(() => {
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
  }, [router]);

  return (
    <div
      className={cn(
        "w-full max-w-full overflow-x-hidden bg-white",
        isLessonRoute
          ? "flex h-dvh max-h-dvh flex-col overflow-hidden"
          : "min-h-dvh",
      )}
    >
      <DashboardNavigation />

      <div
        className={cn(
          "flex w-full max-w-full flex-col overflow-x-hidden md:pl-64",
          isLessonRoute ? "min-h-0 flex-1 overflow-hidden" : "min-h-dvh",
        )}
        {...(!isLessonRoute ? { "data-dashboard-hub": true } : {})}
      >
        {!isLessonRoute ? <DashboardStatusHeader /> : null}

        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-x-hidden",
            isLessonRoute
              ? "overflow-hidden px-0 py-0 pb-20 md:pb-0"
              : "overflow-y-auto px-4 py-6 pb-28 sm:px-6 md:pb-8",
          )}
        >
          {hubIntroId ? <HubIntro hubId={hubIntroId} /> : null}
          {children}
        </main>
      </div>
    </div>
  );
}
