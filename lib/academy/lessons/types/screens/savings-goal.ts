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
  /** When true, the total starts at `targetAmount` and falls as items are dragged. */
  showsRemaining?: boolean;
  poolColumnLabel: string;
  dropZoneLabel: string;
  items: readonly SavingsGoalItem[];
  workshopSignTitle: string;
  lockedLabel: string;
  unlockedLabel: string;
  goalAchievedLabel: string;
  successMessage?: string;
  /** CSV Error cell. Shown when a drop misses the box. Blank cells stay blank. */
  wrongError?: string;
  imagePlaceholder?: {
    label: string;
    alt?: string;
  };
  emphasizeInstruction?: boolean;
}>;
