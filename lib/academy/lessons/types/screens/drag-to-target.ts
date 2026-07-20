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
  successMessage: string;
}>;
