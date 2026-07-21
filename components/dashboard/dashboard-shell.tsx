"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardBottomNav } from "@/components/dashboard/dashboard-bottom-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardStatusHeader } from "@/components/dashboard/dashboard-status-header";
import {
  ONBOARDING_START_PATH,
  readUserSession,
  hasCompletedPersonalizationGate,
} from "@/lib/onboarding/ghost-session";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();

  useEffect(() => {
    const session = readUserSession();
    if (!hasCompletedPersonalizationGate(session)) {
      router.replace(ONBOARDING_START_PATH);
    }
  }, [router]);

  return (
    <div className="min-h-dvh bg-white">
      <DashboardSidebar />
      <DashboardBottomNav />

      <div className="flex min-h-dvh flex-col md:pl-64">
        <DashboardStatusHeader />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-6 pb-28 sm:px-6 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
