import { roundAudAmount } from "@/lib/dashboard/destination-jars";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

export type SavingsGoalId = `goal-${string}`;

export const FREEMIUM_BIG_SAVINGS_GOAL_ID =
  "goal-freemium-big-savings" as SavingsGoalId;
export const FREEMIUM_EMERGENCY_GOAL_ID =
  "goal-freemium-emergency" as SavingsGoalId;

/** @deprecated Use FREEMIUM_BIG_SAVINGS_GOAL_ID. */
export const FREEMIUM_DEFAULT_GOAL_ID = FREEMIUM_BIG_SAVINGS_GOAL_ID;

export type SavingsGoal = {
  id: SavingsGoalId;
  name: string;
  targetAmount: number;
  balance: number;
  emoji: string;
};

export function createSavingsGoalId(): SavingsGoalId {
  return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function defaultSavingsGoal(
  name: string,
  targetAmount: number,
  emoji = "🎯",
): SavingsGoal {
  return {
    id: createSavingsGoalId(),
    name: name.trim() || "My Goal",
    targetAmount: roundAudAmount(Math.max(0, targetAmount)),
    balance: 0,
    emoji,
  };
}

export function savingsGoalProgress(goal: SavingsGoal): number {
  if (goal.targetAmount <= 0) return goal.balance > 0 ? 100 : 0;
  return Math.min(100, (goal.balance / goal.targetAmount) * 100);
}

/** Uncapped percent for display (e.g. 125% when balance exceeds target). */
export function savingsGoalPercentAchieved(goal: SavingsGoal): number {
  if (goal.targetAmount <= 0) return 0;
  return Math.round((goal.balance / goal.targetAmount) * 100);
}

export function isSavingsGoalAtTarget(goal: SavingsGoal): boolean {
  return goal.targetAmount > 0 && goal.balance >= goal.targetAmount;
}

/** True when balance crosses from below target to at/above target. */
export function savingsGoalJustHitTarget(
  before: SavingsGoal,
  after: SavingsGoal,
): boolean {
  if (!isSavingsGoalAtTarget(after)) return false;
  if (before.targetAmount <= 0) return after.balance > 0;
  return before.balance < before.targetAmount;
}

export function findGoalsJustHitTarget(
  before: readonly SavingsGoal[],
  after: readonly SavingsGoal[],
): SavingsGoal[] {
  return after.filter((afterGoal) => {
    const beforeGoal = before.find((entry) => entry.id === afterGoal.id);
    if (!beforeGoal) {
      return isSavingsGoalAtTarget(afterGoal);
    }
    return savingsGoalJustHitTarget(beforeGoal, afterGoal);
  });
}

export function sumSavingsGoalBalances(goals: readonly SavingsGoal[]): number {
  return roundAudAmount(goals.reduce((total, goal) => total + goal.balance, 0));
}

/** Grand total of all savings: unassigned Save Jar + every goal balance. */
export function computeTotalSavings(
  unassignedSaveJarBalance: number,
  goals: readonly SavingsGoal[],
): number {
  return roundAudAmount(unassignedSaveJarBalance + sumSavingsGoalBalances(goals));
}

/** Extra custom goals stay Premium. Friend-test profiles get the one starter only. */
export const VAULT_SAVINGS_GOALS_UNLOCK_CUSTOM_FOR_ALL = false;

export function isFreemiumSystemGoal(id: SavingsGoalId): boolean {
  return id === FREEMIUM_BIG_SAVINGS_GOAL_ID;
}

export function isCustomSavingsGoal(id: SavingsGoalId): boolean {
  return !isFreemiumSystemGoal(id);
}

export function countCustomSavingsGoals(goals: readonly SavingsGoal[]): number {
  return goals.filter((goal) => isCustomSavingsGoal(goal.id)).length;
}

/** Future Premium gate — unrestricted while `VAULT_SAVINGS_GOALS_UNLOCK_CUSTOM_FOR_ALL`. */
export function canAddCustomSavingsGoal(isPremium: boolean): boolean {
  return isPremium || VAULT_SAVINGS_GOALS_UNLOCK_CUSTOM_FOR_ALL;
}

export function canDeleteSavingsGoal(id: SavingsGoalId): boolean {
  return isCustomSavingsGoal(id);
}

/**
 * @deprecated Starter goals no longer preset targets (always $0 for new accounts).
 * Kept for call-site compatibility / suggested amounts in future UI.
 */
export function freemiumDefaultGoalTarget(_cohort: MasteryCohort): number {
  return 0;
}

/** Fixed freemium starter goals — targets and balances start at zero for fresh profiles. */
export function buildFreemiumStarterGoals(_cohort: MasteryCohort): SavingsGoal[] {
  return [
    {
      id: FREEMIUM_BIG_SAVINGS_GOAL_ID,
      name: "Big Savings Goal",
      targetAmount: 0,
      balance: 0,
      emoji: "🎯",
    },
  ];
}

/**
 * Drop the retired Emergency Money starter goal.
 * Any remaining balance is returned so callers can fold it into unassigned Save.
 */
export function retireEmergencyMoneyStarterGoal(
  goals: readonly SavingsGoal[],
): { goals: SavingsGoal[]; returnedBalance: number } {
  let returnedBalance = 0;
  const next: SavingsGoal[] = [];
  for (const goal of goals) {
    if (goal.id === FREEMIUM_EMERGENCY_GOAL_ID) {
      returnedBalance = roundAudAmount(
        returnedBalance + Math.max(0, goal.balance),
      );
      continue;
    }
    next.push(goal);
  }
  return { goals: next, returnedBalance };
}

/**
 * True when goals exist, none have a non-zero target yet, and every balance
 * is still zero — used for the first-goals callout.
 */
export function areAllSavingsGoalTargetsUnset(
  goals: readonly SavingsGoal[],
): boolean {
  return (
    goals.length > 0 &&
    goals.every((goal) => goal.targetAmount <= 0 && goal.balance <= 0)
  );
}

/** Merge persisted freemium goals with required starter templates. */
export function ensureFreemiumStarterGoals(
  goals: readonly SavingsGoal[],
  cohort: MasteryCohort,
): SavingsGoal[] {
  const { goals: withoutRetired } = retireEmergencyMoneyStarterGoal(goals);
  return buildFreemiumStarterGoals(cohort).map((template) => {
    const existing = withoutRetired.find((goal) => goal.id === template.id);
    if (!existing) return template;
    return {
      ...template,
      name: existing.name.trim() || template.name,
      emoji: existing.emoji.trim() || template.emoji,
      balance: roundAudAmount(Math.max(0, existing.balance)),
      targetAmount: roundAudAmount(Math.max(0, existing.targetAmount)),
    };
  });
}

/** Goals shown in the Save Jar UI (freemium templates or premium custom list). */
export function resolveVaultSavingsGoals(
  goals: readonly SavingsGoal[],
  cohort: MasteryCohort,
  isPremium: boolean,
): SavingsGoal[] {
  const { goals: withoutRetired } = retireEmergencyMoneyStarterGoal(goals);

  if (isPremium) {
    const custom = withoutRetired.filter((goal) => isCustomSavingsGoal(goal.id));
    return custom.length > 0 ? custom : ensureFreemiumStarterGoals(withoutRetired, cohort);
  }

  return ensureFreemiumStarterGoals(withoutRetired, cohort);
}
