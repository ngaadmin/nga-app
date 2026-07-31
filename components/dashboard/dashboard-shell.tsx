"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation";
import { DashboardStatusHeader } from "@/components/dashboard/dashboard-status-header";
import {
  ONBOARDING_START_PATH,
  readUserSession,
  hasCompletedPersonalizationGate,
} from "@/lib/onboarding/ghost-session";
import { cn } from "@/lib/utils/cn";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isLessonRoute = pathname.startsWith("/dashboard/academy/lesson/");
  const isVaultRoute = pathname.startsWith("/dashboard/vault");

  useEffect(() => {
    const session = readUserSession();
    if (!hasCompletedPersonalizationGate(session)) {
      router.replace(ONBOARDING_START_PATH);
    }
  }, [router]);

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden bg-white">
      <DashboardNavigation />

      <div className="flex min-h-dvh w-full max-w-full flex-col overflow-x-hidden md:pl-64">
        {!isLessonRoute ? <DashboardStatusHeader /> : null}

        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto",
            isLessonRoute
              ? "px-0 py-0 pb-20"
              : isVaultRoute
                ? "px-4 py-3 pb-28 sm:px-6 md:pb-8"
                : "px-4 py-6 pb-28 sm:px-6 md:pb-8",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
