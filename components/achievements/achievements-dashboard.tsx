"use client";

import { SkillAwardsSection } from "@/components/achievements/skill-awards-section";

export function AchievementsDashboard() {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col overflow-x-hidden bg-white px-1 py-3 md:px-2 md:py-4">
      <SkillAwardsSection />
    </div>
  );
}
