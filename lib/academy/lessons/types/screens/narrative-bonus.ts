import type { WithDeclarative } from "../declarative";

export type NarrativeBonusScreenConfig = WithDeclarative<{
  type: "narrative-bonus";
  id: string;
  narrative: string;
  bonusXp: number;
  bonusTapLabel: string;
  successMessage?: string;
  /** When bonusXp is 0, screen auto-advances when visited */
  autoReadyWhenNoBonus?: boolean;
}>;
