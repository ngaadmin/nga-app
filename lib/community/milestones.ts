import { readAcademyMilestones } from "@/lib/dashboard/academy-progress-storage";
import {
  deriveLevelStatusFromMilestones,
  type AcademyLevelId,
} from "@/lib/dashboard/academy-state";
import { DASHBOARD_HOME_PLACEHOLDER_STATE } from "@/lib/dashboard/home-state";
import { computeTotalSavings } from "@/lib/dashboard/savings-goals";
import { resolveVaultSkillTrophies } from "@/lib/dashboard/skill-trophies";
import { readVaultProfileState } from "@/lib/dashboard/vault/vault-profile-storage";
import {
  hasCompletedPersonalizationGate,
  readUserSession,
} from "@/lib/onboarding/guest-session";

export type CommunityMilestoneId =
  | "first-session"
  | "first-lesson"
  | "first-savings-goal"
  | "first-savings-deposit"
  | "first-medal"
  | "opened-launchpad"
  | "first-module"
  | "streak-3"
  | "first-bronze"
  | "started-business"
  | "saved-50"
  | "skills-5"
  | "streak-7"
  | "module-1"
  | "launchpad-step"
  | "saved-100"
  | "saved-250"
  | "saved-500"
  | "saved-1000"
  | "saved-2500";

export type CommunityMilestoneDefinition = {
  id: CommunityMilestoneId;
  label: string;
  achieverCount: number;
};

/** Journey order. Seed social proof is exact. */
export const COMMUNITY_MILESTONES: readonly CommunityMilestoneDefinition[] = [
  { id: "first-session", label: "First session complete", achieverCount: 4827 },
  { id: "first-lesson", label: "First lesson complete", achieverCount: 4113 },
  { id: "first-savings-goal", label: "First savings goal set", achieverCount: 2946 },
  { id: "first-savings-deposit", label: "First savings deposit", achieverCount: 2618 },
  { id: "first-medal", label: "First medal unlocked", achieverCount: 2184 },
  { id: "opened-launchpad", label: "Opened Launchpad", achieverCount: 1963 },
  { id: "first-module", label: "First module complete", achieverCount: 1647 },
  { id: "streak-3", label: "3-day streak", achieverCount: 1422 },
  { id: "first-bronze", label: "First Bronze skill", achieverCount: 1185 },
  {
    id: "started-business",
    label: "Started first business idea",
    achieverCount: 983,
  },
  { id: "saved-50", label: "Saved $50", achieverCount: 861 },
  { id: "skills-5", label: "5 skills unlocked", achieverCount: 724 },
  { id: "streak-7", label: "7-day streak", achieverCount: 610 },
  { id: "module-1", label: "Module 1 complete", achieverCount: 543 },
  {
    id: "launchpad-step",
    label: "Completed first Launchpad step",
    achieverCount: 417,
  },
  { id: "saved-100", label: "Saved $100", achieverCount: 356 },
  { id: "saved-250", label: "Saved $250", achieverCount: 214 },
  { id: "saved-500", label: "Saved $500", achieverCount: 128 },
  { id: "saved-1000", label: "Saved $1000", achieverCount: 64 },
  { id: "saved-2500", label: "Saved $2500", achieverCount: 23 },
] as const;

export const COMMUNITY_MILESTONE_TOTAL = COMMUNITY_MILESTONES.length;

export type CommunityMilestoneRow = CommunityMilestoneDefinition & {
  achieved: boolean;
};

function isAcademyLevelComplete(
  milestones: ReturnType<typeof readAcademyMilestones>,
  level: AcademyLevelId,
): boolean {
  return deriveLevelStatusFromMilestones(milestones, level) === "completed";
}

/** Real signals only. Missing instrumentation stays not achieved. */
export function evaluateCommunityMilestones(): CommunityMilestoneRow[] {
  const session = readUserSession();
  const academy = readAcademyMilestones();
  const vault = readVaultProfileState(session);
  const skills = resolveVaultSkillTrophies();
  const savings = computeTotalSavings(
    vault.jarBalances["save-jar"],
    vault.savingsGoals,
  );
  const dayStreak = DASHBOARD_HOME_PLACEHOLDER_STATE.dayStreak;
  const completedLesson = academy.some((node) => node.status === "completed");
  const firstModuleComplete = ([1, 2, 3, 4, 5, 6] as const).some((level) =>
    isAcademyLevelComplete(academy, level),
  );
  const unlockedSkills = skills.filter((skill) => skill.tier !== "locked");
  const hasMedal = unlockedSkills.length > 0;
  const hasBronze = skills.some(
    (skill) =>
      skill.tier === "bronze" ||
      skill.tier === "silver" ||
      skill.tier === "gold",
  );
  const hasSavingsGoal = vault.savingsGoals.some((goal) => goal.targetAmount > 0);
  const hasSavingsDeposit =
    savings > 0 ||
    vault.ledger.some(
      (entry) => entry.category === "deposit" || entry.category === "cash_in",
    );

  const achievedById: Record<CommunityMilestoneId, boolean> = {
    "first-session": hasCompletedPersonalizationGate(session),
    "first-lesson": completedLesson,
    "first-savings-goal": hasSavingsGoal,
    "first-savings-deposit": hasSavingsDeposit,
    "first-medal": hasMedal,
    "opened-launchpad": false,
    "first-module": firstModuleComplete,
    "streak-3": dayStreak >= 3,
    "first-bronze": hasBronze,
    "started-business": false,
    "saved-50": savings >= 50,
    "skills-5": unlockedSkills.length >= 5,
    "streak-7": dayStreak >= 7,
    "module-1": isAcademyLevelComplete(academy, 1),
    "launchpad-step": false,
    "saved-100": savings >= 100,
    "saved-250": savings >= 250,
    "saved-500": savings >= 500,
    "saved-1000": savings >= 1000,
    "saved-2500": savings >= 2500,
  };

  return COMMUNITY_MILESTONES.map((milestone) => ({
    ...milestone,
    achieved: achievedById[milestone.id],
  }));
}
