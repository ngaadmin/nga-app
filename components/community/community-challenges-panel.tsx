"use client";

import { CommunityMilestonesSection } from "@/components/community/community-milestones-section";
import { SocialFriendsSection } from "@/components/community/social-friends-section";
import { LeaderboardLockedCard } from "@/components/privacy/leaderboard-locked-card";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";
import {
  resolveLeaderboardView,
  type LeaderboardAudience,
} from "@/lib/privacy/data-controls";

/** Community hub: leaderboard first, then milestones. Off until a parent or teacher switches it on. */
export function CommunityChallengesPanel({
  access,
}: {
  access: { audience: LeaderboardAudience; enabled: boolean };
}) {
  const { isGuestMode } = useDashboardUser();
  const view = resolveLeaderboardView({
    audience: isGuestMode ? "guest" : access.audience,
    enabled: isGuestMode ? false : access.enabled,
  });

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col space-y-6 overflow-x-hidden bg-white px-1 py-2 pb-8">
      {view.visible ? (
        <SocialFriendsSection />
      ) : (
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-[#031F82]">Community</h1>
          <p className="mt-0.5 font-sans text-sm text-[#1E3A5F]">Challenges and the leaderboard.</p>
          <div className="mt-4">
            <LeaderboardLockedCard askButton={view.askButton} />
          </div>
        </div>
      )}
      <CommunityMilestonesSection />
    </div>
  );
}
