import type { WithDeclarative } from "../declarative";

/** Drag a draggable item from a source zone into a target drop zone (e.g. coins → piggy bank). */
export type DragToTargetScreenConfig = WithDeclarative<{
  type: "drag-to-target";
  id: string;
  intro: string;
  sourceLabel: string;
  targetLabel: string;
  itemEmoji?: string;
  /** Visual stack depth for coin-style drags. Default 5. */
  coinCount?: number;
  /** Fallback emoji for the target zone when no image placeholder is set. Default 🐷. */
  targetEmoji?: string;
  /** Image placeholder for the target drop zone (e.g. a character portrait). */
  targetImagePlaceholder?: {
    label: string;
    alt?: string;
  };
  /** Shown in the source column after a successful drop. */
  sourceEmptyMessage?: string;
  successMessage: string;
  emphasizeInstruction?: boolean;
}>;
