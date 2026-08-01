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
}>;
