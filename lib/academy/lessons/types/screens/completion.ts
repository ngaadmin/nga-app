import type { WithDeclarative } from "../declarative";
import type { MedalIllustrationId } from "@/lib/academy/illustrations/medal-registry";

export type CompletionScreenConfig = WithDeclarative<{
  type: "completion";
  id: string;
  /** Pathfinder-style custom completion copy; omit to use LessonCompletionPane defaults */
  skillLearnedLabel?: string;
  pointsLabel?: string;
  bodyCopy?: string;
  returnButtonLabel?: string;
  useStandardPane?: boolean;
  /** Skill medal asset from `public/assets/illustrations/medal/`. */
  medalId?: MedalIllustrationId;
  /**
   * Payload completion row. Show `medalId` as written on the sheet.
   * Lesson-number medal rules do not replace it.
   */
  authoredMedal?: boolean;
  /** Tier from the completion row (`MEDAL:`), or inferred from the medal file. */
  medalTier?: "unlocked" | "bronze" | "silver" | "gold";
  /** Sheet skill name. Wins over the registry label on this screen. */
  skillName?: string;
}>;
