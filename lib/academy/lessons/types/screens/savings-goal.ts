import type { WithDeclarative } from "../declarative";

export type SavingsGoalItem = {
  id: string;
  label: string;
  price: number;
  emoji?: string;
};

/** Drag skipped purchases into a savings bucket; meter fills toward a workshop goal. */
export type SavingsGoalScreenConfig = WithDeclarative<{
  type: "savings-goal";
  id: string;
  intro: string;
  meterLabel: string;
  targetAmount: number;
  poolColumnLabel: string;
  dropZoneLabel: string;
  items: readonly SavingsGoalItem[];
  workshopSignTitle: string;
  lockedLabel: string;
  unlockedLabel: string;
  goalAchievedLabel: string;
  successMessage?: string;
  imagePlaceholder?: {
    label: string;
    alt?: string;
  };
  emphasizeInstruction?: boolean;
}>;
