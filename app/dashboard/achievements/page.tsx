import type { Metadata } from "next";
import { AchievementsDashboard } from "@/components/achievements/achievements-dashboard";
import { copyMatrix } from "@/constants/copyMatrix";

export const metadata: Metadata = {
  title: copyMatrix.dashboard.achievements.title,
  description: copyMatrix.dashboard.achievements.description,
};

export default function AchievementsPage() {
  return <AchievementsDashboard />;
}
