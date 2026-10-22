"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AcademyMomentumHeader } from "@/components/academy/academy-momentum-header";
import { MedalsIntro } from "@/components/achievements/medals-intro";
import { SkillsCollectionPanel } from "@/components/achievements/skills-collection-panel";
import { FullHeightPanel } from "@/components/dashboard/full-height-panel";
import { LearningStreaksPanel } from "@/components/dashboard/learning-streaks-panel";
import { XpExchangeModal } from "@/components/dashboard/points/xp-exchange-modal";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { useXpExchangeGate } from "@/lib/dashboard/use-xp-exchange-gate";
import { ACCOUNT_PROGRESS_RESTORED_EVENT } from "@/lib/dashboard/account-progress-dirty";
import { DASHBOARD_HOME_PLACEHOLDER_STATE } from "@/lib/dashboard/home-state";
import {
  PRACTICE_RECORDED_EVENT,
  readStoredBestStreak,
  readStoredDayStreak,
} from "@/lib/dashboard/streak-practice";
import {
  hasUnseenSkillProgress,
  markSkillsPanelSeen,
} from "@/lib/dashboard/skills-attention";
import { resolveVaultSkillTrophiesForCohort } from "@/lib/dashboard/skill-trophies";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import { useMasteryCohort } from "@/lib/dashboard/use-user-session";
import { zLayerStyle } from "@/lib/ui/layers";

/**
 * Shell-level status strip. XP, streak, and skills cup stay in the same
 * place on every main dashboard screen.
 */
export function DashboardStatusHeader() {
  const router = useRouter();
  const session = useUserSession();
  const { username, isTeacher } = useDashboardUser();
  const { spendableXp, reloadWalletFromStorage } = useDashboardWallet();
  const xpExchange = useXpExchangeGate();
  const { streakFreezes } = DASHBOARD_HOME_PLACEHOLDER_STATE;
  const [dayStreak, setDayStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    function refreshStreak() {
      setDayStreak(readStoredDayStreak());
      setBestStreak(readStoredBestStreak());
    }
    function refreshWallet() {
      reloadWalletFromStorage();
      refreshStreak();
    }
    refreshWallet();
    window.addEventListener(ACCOUNT_PROGRESS_RESTORED_EVENT, refreshWallet);
    window.addEventListener(PRACTICE_RECORDED_EVENT, refreshStreak);
    return () => {
      window.removeEventListener(ACCOUNT_PROGRESS_RESTORED_EVENT, refreshWallet);
      window.removeEventListener(PRACTICE_RECORDED_EVENT, refreshStreak);
    };
  }, [reloadWalletFromStorage]);
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

  const isParent = session?.accountRole === "parent_master";
  const openXpExchange = useCallback(() => {
    if (isParent) {
      router.push("/dashboard/settings");
      return;
    }
    if (!xpExchange.ready || xpExchange.blocked) return;
    setXpExchangeOpen(true);
  }, [isParent, router, xpExchange.blocked, xpExchange.ready]);

  return (
    <>
      <header
        data-dashboard-status-header
        style={zLayerStyle("sticky")}
        className="sticky top-0 print:hidden"
      >
        <AcademyMomentumHeader
          username={username}
          xp={spendableXp}
          dayStreak={dayStreak}
          skillsHasAttention={skillsHasAttention}
          showCoins={!isTeacher}
          onSkillsClick={openSkills}
          onStreakClick={openStreaks}
          onXpClick={
            isParent || (xpExchange.ready && !xpExchange.blocked)
              ? openXpExchange
              : undefined
          }
        />
      </header>

      <FullHeightPanel
        isOpen={skillsOpen}
        title="Medals"
        titleId="medals-collection-title"
        titleAccessory={<MedalsIntro />}
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
          bestStreak={bestStreak}
          streakFreezes={streakFreezes}
        />
      </FullHeightPanel>
      <XpExchangeModal
        isOpen={xpExchangeOpen && xpExchange.ready && !xpExchange.blocked}
        onClose={() => setXpExchangeOpen(false)}
      />
    </>
  );
}
