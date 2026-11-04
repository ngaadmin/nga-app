"use client";

import { PARENT_HUB_TO_SETTLE_EVENT } from "@/lib/parent/parent-hub-events";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AcademyMomentumHeader } from "@/components/academy/academy-momentum-header";
import { FullHeightPanel } from "@/components/dashboard/full-height-panel";
import { LearningStreaksPanel } from "@/components/dashboard/learning-streaks-panel";
import { useProfileAvatar } from "@/components/dashboard/profile/profile-avatar";
import { ProfilePanel } from "@/components/dashboard/profile/profile-panel";
import {
  ProfileSwitcherMenu,
  ProfileSwitcherTip,
} from "@/components/dashboard/profile-switcher/profile-switcher";
import {
  hasAccountSeenProfileSwitcherTip,
  markAccountProfileSwitcherTipSeen,
} from "@/lib/dashboard/page-intro-seen";
import { useHouseholdProfilesState } from "@/lib/profile-switcher/use-household-profiles";
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
import { masteryCohortLabel } from "@/lib/dashboard/mastery-cohort";
import { zLayerStyle } from "@/lib/ui/layers";
import { useParentTabAccess } from "@/lib/parent/use-parent-tab-access";
import { PARENT_TAB_HREF } from "@/lib/parent/parent-tab-eligibility";
import {
  wantsProfileAchievements,
  withoutProfileQuery,
} from "@/lib/dashboard/profile-deep-link";

const GUEST_STATUS_ROW_CLASS =
  "!grid-cols-[max-content_minmax(0,1fr)_auto]";

/**
 * Shell-level status strip. Avatar (profile and medals), username, streak,
 * and coins stay in the same place on every main dashboard screen.
 */
export function DashboardStatusHeader() {
  const router = useRouter();
  const session = useUserSession();
  const { username, isTeacher, isGuestMode, isLoading: userLoading } =
    useDashboardUser();
  const { spendableXp, reloadWalletFromStorage } = useDashboardWallet();
  const xpExchange = useXpExchangeGate();
  const { streakFreezes } = DASHBOARD_HOME_PLACEHOLDER_STATE;
  const parentHubAccess = useParentTabAccess();
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

  const [profileOpen, setProfileOpen] = useState(false);
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

  const openProfile = useCallback(() => {
    setProfileOpen(true);
    markSkillsPanelSeen(cohortSkills);
    setSkillsAttentionTick((tick) => tick + 1);
  }, [cohortSkills]);

  // Old /dashboard/achievements links redirect here with ?profile=achievements:
  // open the profile at its Achievements section, then drop the query.
  const [achievementsDeepLink, setAchievementsDeepLink] = useState(false);
  useEffect(() => {
    if (!wantsProfileAchievements(window.location.search)) return;
    setAchievementsDeepLink(true);
    openProfile();
    window.history.replaceState(
      window.history.state,
      "",
      withoutProfileQuery(window.location.href),
    );
  }, [openProfile]);

  const openStreaks = useCallback(() => {
    setStreaksOpen(true);
  }, []);

  const isParent = session?.accountRole === "parent_master";
  const showTrack = Boolean(session) && !isParent && !isTeacher;
  const trackLabel = showTrack ? masteryCohortLabel(masteryCohort) : null;
  const profileKey =
    session?.supabaseUserId?.trim() ||
    session?.genericProfileId?.trim() ||
    session?.username?.trim() ||
    "device";
  const { avatarId: trackAvatarId, chosenAvatarId, chooseAvatar } =
    useProfileAvatar(profileKey, masteryCohort);
  // A parent is never shown as a track character: their own pick, or their initial.
  const avatarId = isParent ? chosenAvatarId : trackAvatarId;
  const { household, loading: householdLoading } = useHouseholdProfilesState();
  const switcherButtonRef = useRef<HTMLButtonElement>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [tipVisible, setTipVisible] = useState(false);

  // One-time tip, stored with the per-account intro flags. Waits until no
  // modal intro is covering the screen, then counts as seen once shown.
  useEffect(() => {
    if (!household) return;
    if (hasAccountSeenProfileSwitcherTip()) return;
    let shown = false;
    const tryShow = () => {
      if (shown) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      shown = true;
      setTipVisible(true);
      markAccountProfileSwitcherTipSeen();
    };
    tryShow();
    const timer = window.setInterval(tryShow, 600);
    return () => window.clearInterval(timer);
  }, [household]);

  useEffect(() => {
    if (!tipVisible) return;
    const hide = window.setTimeout(() => setTipVisible(false), 8000);
    return () => window.clearTimeout(hide);
  }, [tipVisible]);

  const toggleSwitcher = useCallback(() => {
    setTipVisible(false);
    setSwitcherOpen((open) => !open);
  }, []);
  const closeSwitcher = useCallback(() => setSwitcherOpen(false), []);
  const viewProfileFromSwitcher = useCallback(() => {
    setSwitcherOpen(false);
    openProfile();
  }, [openProfile]);

  const openSettingsFromSwitcher = useCallback(() => {
    setSwitcherOpen(false);
    router.push("/dashboard/settings");
  }, [router]);
  const openParentHubFromSwitcher = useCallback(() => {
    setSwitcherOpen(false);
    router.push(PARENT_TAB_HREF);
  }, [router]);
  const openParentHubFromProfile = useCallback(() => {
    setProfileOpen(false);
    router.push(PARENT_TAB_HREF);
  }, [router]);
  const canOpenParentHub = isParent && parentHubAccess.eligible;

  const openXpExchange = useCallback(() => {
    if (isParent) {
      // Coins open the Parent Hub's "to settle" list. Without a Parent tab
      // (no active child yet) they open Settings instead.
      router.push(
        parentHubAccess.eligible ? `${PARENT_TAB_HREF}#to-settle` : "/dashboard/settings",
      );
      // Already on the Hub: a same-page hash push doesn't reload it.
      if (parentHubAccess.eligible) {
        window.dispatchEvent(new Event(PARENT_HUB_TO_SETTLE_EVENT));
      }
      return;
    }
    if (!xpExchange.ready || xpExchange.blocked) return;
    setXpExchangeOpen(true);
  }, [isParent, parentHubAccess.eligible, router, xpExchange.blocked, xpExchange.ready]);

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
          avatarId={avatarId}
          trackLabel={isParent ? "Parent" : trackLabel}
          trackLabelIsRole={isParent}
          // Username sits beside the avatar for every account. Guests keep the
          // save-progress control in the center; signed-in accounts leave the
          // center empty so the name is not shown twice.
          showUsernameLabel={!userLoading}
          center={userLoading || isGuestMode ? undefined : null}
          // Guests: avatar and name take what they need, the one-line save
          // button gets the rest, so the name is not cut off.
          rowClassName={isGuestMode ? GUEST_STATUS_ROW_CLASS : undefined}
          profileHasAttention={skillsHasAttention}
          showCoins={!isTeacher}
          // The avatar always opens the dropdown (never the Profile page
          // directly), even while the household is still loading.
          onProfileClick={toggleSwitcher}
          profileSwitcher={{
            open: switcherOpen,
            buttonRef: switcherButtonRef,
            tip:
              household && tipVisible ? (
                <ProfileSwitcherTip onDismiss={() => setTipVisible(false)} />
              ) : null,
          }}
          onStreakClick={openStreaks}
          onXpClick={
            isParent || (xpExchange.ready && !xpExchange.blocked)
              ? openXpExchange
              : undefined
          }
        />
      </header>

      <ProfileSwitcherMenu
        open={switcherOpen}
        anchorRef={switcherButtonRef}
        household={household}
        loading={householdLoading}
        currentAvatarId={avatarId}
        onClose={closeSwitcher}
        onViewProfile={viewProfileFromSwitcher}
        onOpenSettings={openSettingsFromSwitcher}
        onOpenParentHub={canOpenParentHub ? openParentHubFromSwitcher : undefined}
        isParent={isParent}
        isGuest={isGuestMode}
      />

      <FullHeightPanel
        isOpen={profileOpen}
        title="Profile"
        titleId="profile-panel-title"
        onClose={() => {
          setProfileOpen(false);
          setAchievementsDeepLink(false);
        }}
      >
        <ProfilePanel
          displayName={username}
          trackLabel={trackLabel}
          // TODO(role pill): Cath is deciding what the parent's line under the
          // username should say. Keep "Parent" until then.
          roleLabel={isParent ? "Parent" : null}
          avatarId={avatarId}
          onChooseAvatar={chooseAvatar}
          household={household}
          onOpenParentHub={canOpenParentHub ? openParentHubFromProfile : undefined}
          achievementsInitiallyOpen={achievementsDeepLink}
        />
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
