import type { WithDeclarative } from "../declarative";

export type CompletionScreenConfig = WithDeclarative<{
  type: "completion";
  id: string;
  /** Pathfinder-style custom completion copy; omit to use LessonCompletionPane defaults */
  skillLearnedLabel?: string;
  pointsLabel?: string;
  bodyCopy?: string;
  returnButtonLabel?: string;
  useStandardPane?: boolean;
}>;
