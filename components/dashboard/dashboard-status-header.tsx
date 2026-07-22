"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { GhostModeBadge } from "@/components/dashboard/ghost-mode-badge";
import { copyMatrix } from "@/constants/copyMatrix";
import {
  FlameIcon,
  SnowflakeIcon,
  XpStarIcon,
} from "@/lib/dashboard/icons";
import { DASHBOARD_HOME_PLACEHOLDER_STATE } from "@/lib/dashboard/home-state";
import { VAULT_CASH_IN_HREF } from "@/lib/dashboard/navigation";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";
import { zLayerStyle } from "@/lib/ui/layers";
import { cn } from "@/lib/utils/cn";

const statusPillClass =
  "inline-flex items-center gap-1.5 rounded-full border-0 bg-white px-2.5 py-1 shadow-md sm:gap-2 sm:px-3 sm:py-1.5";

const statusValueClass =
  "font-heading text-[10px] font-bold leading-none text-nga-primary sm:text-xs";

type StatusPillProps = {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
};

function StatusPill({ icon, label, value, href }: StatusPillProps) {
  const content = (
    <>
      {icon}
      <span className={statusValueClass}>{value}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          statusPillClass,
          "transition-transform hover:scale-[1.03] active:scale-[0.98]",
        )}
        aria-label={`${label}: ${value}. Tap to cash in points in The Vault.`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={statusPillClass} aria-label={`${label}: ${value}`}>
      {content}
    </div>
  );
}

export function DashboardStatusHeader() {
  const { isGhostMode, isLoading } = useDashboardUser();
  const { totalPoints } = useDashboardWallet();
  const { dayStreak, streakFreezes } = DASHBOARD_HOME_PLACEHOLDER_STATE;
  const streakCopy = copyMatrix.home.streak;

  return (
    <header
      data-dashboard-status-header
      style={zLayerStyle("sticky")}
      className="sticky top-0 bg-white/95 px-4 py-2 backdrop-blur-sm sm:px-6"
    >
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
          <StatusPill
            icon={
              <XpStarIcon className="size-3.5 shrink-0 text-nga-accent sm:size-4" />
            }
            label="Total points"
            value={`${totalPoints} XP`}
            href={VAULT_CASH_IN_HREF}
          />
          <StatusPill
            icon={
              <FlameIcon className="size-3.5 shrink-0 text-nga-cta sm:size-4" />
            }
            label={streakCopy.label}
            value={`${dayStreak} ${streakCopy.unit}`}
          />
          <StatusPill
            icon={
              <SnowflakeIcon className="size-3.5 shrink-0 text-nga-secondary sm:size-4" />
            }
            label="Streak freezes"
            value={String(streakFreezes)}
          />
        </div>

        {isGhostMode && !isLoading ? (
          <GhostModeBadge className={cn("max-w-full")} size="sm" />
        ) : null}
      </div>
    </header>
  );
}
