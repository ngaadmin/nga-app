"use client";

import {
  STATUS_BANNER_ICON_CLASS,
  StatusBannerLayout,
} from "@/components/dashboard/status-banner-layout";
import { StatusMetricPill } from "@/components/dashboard/status-metric-pill";
import { UserHandleControl } from "@/components/dashboard/user-handle-control";
import { copyMatrix } from "@/constants/copyMatrix";
import { SnowflakeIcon, XpStarIcon } from "@/lib/dashboard/icons";
import { cn } from "@/lib/utils/cn";

type AcademyMomentumHeaderProps = {
  username: string;
  xp: number;
  streakFreezes: number;
};

export function AcademyMomentumHeader({
  username,
  xp,
  streakFreezes,
}: AcademyMomentumHeaderProps) {
  const shieldCopy = copyMatrix.home.shield;
  const journeyCopy = copyMatrix.dashboard.academy.journey;

  return (
    <StatusBannerLayout
      aria-label="Academy stats"
      left={
        <StatusMetricPill
          interactive
          icon={
            <XpStarIcon
              className={cn(STATUS_BANNER_ICON_CLASS, "text-nga-accent")}
            />
          }
          value={xp}
          unitLabel={journeyCopy.xpLabel}
          ariaLabel={`${xp} ${journeyCopy.xpLabel}`}
          info={{
            title: "Your XP",
            body: "Points you earn by crushing Academy lessons. Stack them up, then cash in from Vault when you're ready.",
          }}
        />
      }
      center={
        <UserHandleControl
          username={username}
          size="sm"
          className="min-w-0 max-w-full"
        />
      }
      right={
        <StatusMetricPill
          interactive
          icon={
            <SnowflakeIcon
              className={cn(STATUS_BANNER_ICON_CLASS, "text-nga-secondary")}
            />
          }
          value={streakFreezes}
          ariaLabel={`${streakFreezes} ${shieldCopy.activeLabel}`}
          title={shieldCopy.label}
          info={{
            title: shieldCopy.label,
            body: "Streak freezes keep your day streak safe if you miss a day. Earn more by staying consistent in Academy.",
          }}
        />
      }
    />
  );
}
