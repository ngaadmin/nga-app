import type { WithDeclarative } from "../declarative";

export type BudgetSelectItem = {
  id: string;
  label: string;
  price: number;
  emoji?: string;
};

export type BudgetSelectScreenConfig = WithDeclarative<{
  type: "budget-select";
  id: string;
  intro: string;
  walletLabel?: string;
  total: number;
  items: readonly BudgetSelectItem[];
  correctIds: readonly string[];
  errors: {
    overBudget: string;
    wrongSelection: string;
    /** Shown when a specific required item is missing (keyed by item id). */
    itemHints?: Record<string, string>;
  };
  successMessage?: string;
  emphasizeInstruction?: boolean;
}>;
