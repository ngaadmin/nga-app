import { SafeguardShieldCard } from "@/components/dashboard/safeguard-shield-card";
import { SkillPathTrack } from "@/components/dashboard/skill-path-track";
import { StreakTrackerCard } from "@/components/dashboard/streak-tracker-card";
import { DASHBOARD_HOME_PLACEHOLDER_STATE } from "@/lib/dashboard/home-state";

export function DashboardHome() {
  const { dayStreak, streakFreezes, skillNodes } = DASHBOARD_HOME_PLACEHOLDER_STATE;

  return (
    <section
      aria-label="Dashboard home"
      className="mx-auto flex min-h-0 max-w-2xl flex-1 flex-col"
    >
      <div className="mb-6 grid shrink-0 grid-cols-2 gap-3">
        <StreakTrackerCard dayStreak={dayStreak} />
        <SafeguardShieldCard streakFreezes={streakFreezes} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <SkillPathTrack nodes={skillNodes} />
      </div>
    </section>
  );
}
