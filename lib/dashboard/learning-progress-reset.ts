import {
  defaultAcademyMilestones,
  saveAcademyMilestones,
} from "@/lib/dashboard/academy-progress-storage";
import { saveVaultSkillTierOverrides } from "@/lib/dashboard/vault-skill-progress-storage";

export const LEARNING_PROGRESS_RESET_EVENT = "nga:learning-progress-reset";

/** Clears Academy milestones and Vault skill trophy progress. */
export function resetLearningProgress(): void {
  if (typeof window === "undefined") return;

  saveAcademyMilestones(defaultAcademyMilestones());
  saveVaultSkillTierOverrides({});
  window.dispatchEvent(new CustomEvent(LEARNING_PROGRESS_RESET_EVENT));
}
