"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AcademyMomentumHeader } from "@/components/academy/academy-momentum-header";
import { SkillsCollectionPanel } from "@/components/achievements/skills-collection-panel";
import { FullHeightPanel } from "@/components/dashboard/full-height-panel";
import { LearningStreaksPanel } from "@/components/dashboard/learning-streaks-panel";
import { XpExchangeModal } from "@/components/dashboard/points/xp-exchange-modal";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { DASHBOARD_HOME_PLACEHOLDER_STATE } from "@/lib/dashboard/home-state";
import {
  hasUnseenSkillProgress,
  markSkillsCupIntroSeen,
  markSkillsPanelSeen,
  shouldShowSkillsCupIntro,
} from "@/lib/dashboard/skills-attention";
import { resolveVaultSkillTrophiesForCohort } from "@/lib/dashboard/skill-trophies";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";
import { useMasteryCohort } from "@/lib/dashboard/use-user-session";
import { zLayerStyle } from "@/lib/ui/layers";

/**
 * Shell-level status strip. Coins, streak, and skills cup stay in the same
 * place on every main dashboard screen.
 */
export function DashboardStatusHeader() {
  const { username } = useDashboardUser();
  const { lifetimePointsEarned } = useDashboardWallet();
  const { dayStreak, streakFreezes } = DASHBOARD_HOME_PLACEHOLDER_STATE;
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
  const [showSkillsCupIntro, setShowSkillsCupIntro] = useState(false);

  useEffect(() => {
    setSkillsHasAttention(hasUnseenSkillProgress(cohortSkills));
    setShowSkillsCupIntro(shouldShowSkillsCupIntro(cohortSkills));
  }, [cohortSkills, skillsAttentionTick]);

  const dismissSkillsCupIntro = useCallback(() => {
    markSkillsCupIntroSeen();
    setShowSkillsCupIntro(false);
  }, []);

  const openSkills = useCallback(() => {
    setSkillsOpen(true);
    markSkillsPanelSeen(cohortSkills);
    markSkillsCupIntroSeen();
    setShowSkillsCupIntro(false);
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
        <AcademyMomentumHeader
          username={username}
          xp={lifetimePointsEarned}
          dayStreak={dayStreak}
          skillsHasAttention={skillsHasAttention}
          showSkillsCupIntro={showSkillsCupIntro}
          onSkillsClick={openSkills}
          onSkillsIntroSeen={dismissSkillsCupIntro}
          onStreakClick={openStreaks}
          onXpClick={openXpExchange}
        />
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
