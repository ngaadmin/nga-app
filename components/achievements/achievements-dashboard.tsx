"use client";

import { SkillAwardsSection } from "@/components/achievements/skill-awards-section";
import { LearningStreaksSection } from "@/components/achievements/learning-streaks-section";
import { MoneyMilestonesSection } from "@/components/achievements/money-milestones-section";
import { MonthlyChallengesSection } from "@/components/achievements/monthly-challenges-section";
import { SocialFriendsSection } from "@/components/achievements/social-friends-section";

export function AchievementsDashboard() {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col space-y-14 overflow-x-hidden bg-white px-2 py-6 pb-10">
      <SkillAwardsSection />
      <LearningStreaksSection />
      <MoneyMilestonesSection />
      <MonthlyChallengesSection />
      <SocialFriendsSection />
    </div>
  );
}
