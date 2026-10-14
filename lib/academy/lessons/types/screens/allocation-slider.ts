import type { WithDeclarative } from "../declarative";

export type AllocationSliderItem = {
  id: string;
  label: string;
  amount: number;
  emoji?: string;
};

export type AllocationSliderScreenConfig = WithDeclarative<{
  type: "allocation-slider";
  id: string;
  intro: string;
  /** How to use the slider. Shown under the story line. */
  instruction?: string;
  total: number;
  /** Minimum amount to reserve before the screen completes. */
  targetMin: number;
  /** Items protected by reserving (e.g. savings goal). */
  reserveGoals: readonly AllocationSliderItem[];
  /** Optional spend-today items dimmed when reserve goal is met. */
  spendItems?: readonly AllocationSliderItem[];
  sliderError: string;
  successMessage?: string;
  emphasizeInstruction?: boolean;
}>;
