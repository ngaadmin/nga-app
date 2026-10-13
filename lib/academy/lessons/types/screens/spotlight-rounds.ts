import type { CashComparison, CashUpdate } from "@/lib/academy/lessons/payload/cash-placeholder";
import type { WithDeclarative } from "../declarative";

/** One path on a decision spotlight. Either visible choice can advance. */
export type SpotlightDecisionOption = {
  label: string;
  isCorrect?: boolean;
  cashUpdate?: CashUpdate;
  goToLabel?: string;
  goToIndex?: number;
  showWhen?: CashComparison;
};

export type SpotlightRoundsScreenConfig = WithDeclarative<{
  type: "spotlight-rounds";
  id: string;
  prompt: string;
  rounds: readonly {
    iconA: string;
    optionA: string;
    iconB: string;
    optionB: string;
    correct: "a" | "b";
    error: string;
  }[];
  choiceFeedback?: "colored" | "neutral-selected";
  emphasizeInstruction?: boolean;
  /**
   * Every visible choice is a valid path. Used when the sheet has `SET cash`
   * or `GO Screen` and no CORRECT key.
   */
  decisionPath?: boolean;
  options?: readonly SpotlightDecisionOption[];
  promptWhen?: readonly { text: string; showWhen: CashComparison }[];
  wrongError?: string;
}>;
