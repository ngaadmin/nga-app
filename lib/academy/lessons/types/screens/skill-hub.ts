import type { WithDeclarative } from "../declarative";

export type SkillHubSkill = {
  label: string;
  emoji?: string;
  goToLabel?: string;
  goToIndex?: number;
  /** Screen label this skill opens. Marked done when play returns to the hub. */
  hubSkillKey: string;
};

export type SkillHubOption = {
  label: string;
  isCorrect: boolean;
  emoji?: string;
  goToLabel?: string;
  goToIndex?: number;
  hubSkillKey?: string;
  requiresHubSkills?: readonly string[];
};

/** Three skill tiles plus one Finish control. Finish is not a fourth tile. */
export type SkillHubScreenConfig = WithDeclarative<{
  type: "skill-hub";
  id: string;
  prompt: string;
  skills: readonly SkillHubSkill[];
  finishLabel: string;
  finishToLabel?: string;
  finishToIndex?: number;
  /**
   * Linker and lesson graph. Includes Finish so the hub can reach completion.
   * The screen renders Finish as its own button, not as a tile.
   */
  options: readonly SkillHubOption[];
}>;
