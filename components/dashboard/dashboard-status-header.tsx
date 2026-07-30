"use client";

import { usePathname } from "next/navigation";
import { GhostModeBadge } from "@/components/dashboard/ghost-mode-badge";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";
import { zLayerStyle } from "@/lib/ui/layers";
import { cn } from "@/lib/utils/cn";

export function DashboardStatusHeader() {
  const pathname = usePathname();
  const { isGhostMode, isLoading } = useDashboardUser();
  const isAcademyRoute = pathname.startsWith("/dashboard/academy");
  const showGhostMode = isGhostMode && !isLoading && !isAcademyRoute;

  if (!showGhostMode) {
    return null;
  }

  return (
    <header
      data-dashboard-status-header
      style={zLayerStyle("sticky")}
      className="sticky top-0 bg-white/95 px-4 py-2 backdrop-blur-sm sm:px-6"
    >
      <div className="mx-auto flex w-full max-w-md justify-center">
        <GhostModeBadge className={cn("max-w-full")} size="sm" />
      </div>
    </header>
  );
}
