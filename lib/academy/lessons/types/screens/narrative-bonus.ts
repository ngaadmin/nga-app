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
  /** Closing beat: headline, story, light confetti, and Next with no Continue card. */
  resolution?: boolean;
  /** Shown on the first voiced story beat of a lesson. The module intro counts as lesson 1. */
  credit?: string;
  /** Narration clip. Playback length comes from the file. */
  audio?: { src: string; durationMs: number };
}>;
