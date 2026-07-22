import { roundAudAmount } from "@/lib/dashboard/destination-jars";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

export type SavingsGoalId = `goal-${string}`;

export const FREEMIUM_DEFAULT_GOAL_ID = "goal-default-freemium" as SavingsGoalId;

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

export function sumSavingsGoalBalances(goals: readonly SavingsGoal[]): number {
  return roundAudAmount(goals.reduce((total, goal) => total + goal.balance, 0));
}

/** Cohort-scaled target for the freemium read-only default goal. */
export function freemiumDefaultGoalTarget(cohort: MasteryCohort): number {
  switch (cohort) {
    case "explorer":
      return 50;
    case "pathfinder":
      return 100;
    case "maverick":
      return 250;
  }
}

export function buildFreemiumDefaultGoal(
  totalSavings: number,
  targetAmount: number,
  name = "My First Goal",
): SavingsGoal {
  return {
    id: FREEMIUM_DEFAULT_GOAL_ID,
    name,
    targetAmount: roundAudAmount(Math.max(0, targetAmount)),
    balance: roundAudAmount(Math.max(0, totalSavings)),
    emoji: "🎯",
  };
}
