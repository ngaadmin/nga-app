"use client";

import { usePathname } from "next/navigation";
import { AcademyMomentumHeader } from "@/components/academy/academy-momentum-header";
import { StatusBannerLayout } from "@/components/dashboard/status-banner-layout";
import { UserHandleControl } from "@/components/dashboard/user-handle-control";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { DASHBOARD_HOME_PLACEHOLDER_STATE } from "@/lib/dashboard/home-state";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";
import { zLayerStyle } from "@/lib/ui/layers";

/**
 * Shell-level status strip. Keeps the profile handle pinned to the same center
 * slot on every non-lesson dashboard route. Academy renders the full stats row
 * (XP · handle · freezes); other routes render the centered handle alone.
 */
export function DashboardStatusHeader() {
  const pathname = usePathname();
  const isAcademyRoute = pathname.startsWith("/dashboard/academy");
  const { username } = useDashboardUser();
  const { lifetimePointsEarned } = useDashboardWallet();
  const streakFreezes = DASHBOARD_HOME_PLACEHOLDER_STATE.streakFreezes;

  return (
    <header
      data-dashboard-status-header
      style={zLayerStyle("sticky")}
      className="sticky top-0"
    >
      {isAcademyRoute ? (
        <AcademyMomentumHeader
          username={username}
          xp={lifetimePointsEarned}
          streakFreezes={streakFreezes}
        />
      ) : (
        <StatusBannerLayout
          aria-label="Profile"
          center={
            <UserHandleControl size="sm" className="min-w-0 max-w-full" />
          }
        />
      )}
    </header>
  );
}
