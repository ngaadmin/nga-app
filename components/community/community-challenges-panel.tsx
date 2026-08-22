"use client";

import { CommunityMilestonesSection } from "@/components/community/community-milestones-section";
import { SocialFriendsSection } from "@/components/community/social-friends-section";

/** Community hub: leaderboard first, then milestones. */
export function CommunityChallengesPanel() {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col space-y-6 overflow-x-hidden bg-white px-1 py-2 pb-8">
      <SocialFriendsSection />
      <CommunityMilestonesSection />
    </div>
  );
}
