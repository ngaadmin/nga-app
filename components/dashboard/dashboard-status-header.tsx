"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AcademyMomentumHeader } from "@/components/academy/academy-momentum-header";
import { SkillsCollectionPanel } from "@/components/achievements/skills-collection-panel";
import { FullHeightPanel } from "@/components/dashboard/full-height-panel";
import { LearningStreaksPanel } from "@/components/dashboard/learning-streaks-panel";
import { XpExchangeModal } from "@/components/dashboard/points/xp-exchange-modal";
import {
  STATUS_BANNER_ICON_CLASS,
  StatusBannerLayout,
} from "@/components/dashboard/status-banner-layout";
import { StatusMetricPill } from "@/components/dashboard/status-metric-pill";
import { UserHandleControl } from "@/components/dashboard/user-handle-control";
import { copyMatrix } from "@/constants/copyMatrix";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { DASHBOARD_HOME_PLACEHOLDER_STATE } from "@/lib/dashboard/home-state";
import { FlameIcon } from "@/lib/dashboard/icons";
import {
  hasUnseenSkillProgress,
  markSkillsPanelSeen,
} from "@/lib/dashboard/skills-attention";
import { resolveVaultSkillTrophiesForCohort } from "@/lib/dashboard/skill-trophies";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";
import { useMasteryCohort } from "@/lib/dashboard/use-user-session";
import { zLayerStyle } from "@/lib/ui/layers";
import { cn } from "@/lib/utils/cn";

/**
 * Shell-level status strip. Academy: XP · handle · streak + skills cup.
 * Other routes: day streak + centered handle. Collection panels open full-height.
 */
export function DashboardStatusHeader() {
  const pathname = usePathname();
  const isAcademyRoute = pathname.startsWith("/dashboard/academy");
  const { username } = useDashboardUser();
  const { lifetimePointsEarned } = useDashboardWallet();
  const { dayStreak, streakFreezes } = DASHBOARD_HOME_PLACEHOLDER_STATE;
  const streakCopy = copyMatrix.home.streak;
  const masteryCohort = useMasteryCohort();

  const [skillsOpen, setSkillsOpen] = useState(false);
  const [streaksOpen, setStreaksOpen] = useState(false);
  const [xpExchangeOpen, setXpExchangeOpen] = useState(false);
  const [skillsAttentionTick, setSkillsAttentionTick] = useState(0);

  const cohortSkills = useMemo(
    () => resolveVaultSkillTrophiesForCohort(masteryCohort),
    [masteryCohort],
  );

  const [skillsHasAttention, setSkillsHasAttention] = useState(false);

  useEffect(() => {
    setSkillsHasAttention(hasUnseenSkillProgress(cohortSkills));
  }, [cohortSkills, skillsAttentionTick]);

  const openSkills = useCallback(() => {
    setSkillsOpen(true);
    markSkillsPanelSeen(cohortSkills);
    setSkillsAttentionTick((tick) => tick + 1);
  }, [cohortSkills]);

  const openStreaks = useCallback(() => {
    setStreaksOpen(true);
  }, []);

  const openXpExchange = useCallback(() => {
    setXpExchangeOpen(true);
  }, []);

  return (
    <>
      <header
        data-dashboard-status-header
        style={zLayerStyle("sticky")}
        className="sticky top-0"
      >
        {isAcademyRoute ? (
          <AcademyMomentumHeader
            username={username}
            xp={lifetimePointsEarned}
            dayStreak={dayStreak}
            skillsHasAttention={skillsHasAttention}
            onSkillsClick={openSkills}
            onStreakClick={openStreaks}
            onXpClick={openXpExchange}
          />
        ) : (
          <StatusBannerLayout
            aria-label="Profile"
            left={
              <StatusMetricPill
                interactive
                onClick={openStreaks}
                icon={
                  <FlameIcon
                    className={cn(STATUS_BANNER_ICON_CLASS, "text-nga-cta")}
                  />
                }
                value={dayStreak}
                unitLabel={streakCopy.unit}
                ariaLabel={`${dayStreak} ${streakCopy.label}`}
                title={streakCopy.label}
              />
            }
            center={
              <UserHandleControl size="sm" className="min-w-0 max-w-full" />
            }
          />
        )}
      </header>

      <FullHeightPanel
        isOpen={skillsOpen}
        title="Skills"
        titleId="skills-collection-title"
        onClose={() => setSkillsOpen(false)}
      >
        <SkillsCollectionPanel />
      </FullHeightPanel>

      <FullHeightPanel
        isOpen={streaksOpen}
        title="Learning Streaks"
        titleId="learning-streaks-title"
        onClose={() => setStreaksOpen(false)}
      >
        <LearningStreaksPanel
          dayStreak={dayStreak}
          streakFreezes={streakFreezes}
        />
      </FullHeightPanel>
      <XpExchangeModal
        isOpen={xpExchangeOpen}
        onClose={() => setXpExchangeOpen(false)}
      />
    </>
  );
}
