import type { IllustrationId } from "@/lib/academy/illustrations/illustration-registry";
import type { WithDeclarative } from "../declarative";

/** Visual size of the draggable item. `lg` is easier to hit on mobile. */
export type DragToTargetItemSize = "md" | "lg";

/** Drag a draggable item from a source zone into a target drop zone (e.g. coins → piggy bank). */
export type DragToTargetScreenConfig = WithDeclarative<{
  type: "drag-to-target";
  id: string;
  intro: string;
  sourceLabel: string;
  targetLabel: string;
  itemEmoji?: string;
  /** Visual size of the draggable emoji. Default `md`. */
  itemSize?: DragToTargetItemSize;
  /** Visual stack depth for coin-style drags. Default 5. */
  coinCount?: number;
  /** Fallback emoji for the target zone when no image is set. Default 🐷. */
  targetEmoji?: string;
  /** Registry key for the target drop-zone character/scene art. */
  targetIllustrationId?: IllustrationId;
  /** Alt text for `targetIllustrationId`. Defaults to `targetLabel`. */
  targetIllustrationAlt?: string;
  /** Image placeholder for the target drop zone when no registry art is set. */
  targetImagePlaceholder?: {
    label: string;
    alt?: string;
  };
  /** Shown in the source column after a successful drop. */
  sourceEmptyMessage?: string;
  /** Hide GIFT/SENNA-style column labels when the art already names the items. Default true. */
  showZoneLabels?: boolean;
  successMessage: string;
  emphasizeInstruction?: boolean;
}>;
