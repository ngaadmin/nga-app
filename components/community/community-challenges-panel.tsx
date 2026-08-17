"use client";

import { MonthlyChallengesSection } from "@/components/community/monthly-challenges-section";
import { SocialFriendsSection } from "@/components/community/social-friends-section";

/** Community hub: monthly challenges + friends leaderboard. */
export function CommunityChallengesPanel() {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col space-y-12 overflow-x-hidden bg-white px-1 py-4 pb-8">
      <MonthlyChallengesSection />
      <SocialFriendsSection />
    </div>
  );
}
