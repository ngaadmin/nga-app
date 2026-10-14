import type { IllustrationId } from "@/lib/academy/illustrations/illustration-registry";
import type { ScreenAuthoringMeta } from "./meta";

export type AdvancePolicy =
  | { mode: "on-complete" }
  | { mode: "auto-ready" }
  | { mode: "manual-next" }
  | { mode: "all-taps-revealed" }
  | { mode: "all-items-sorted" }
  | { mode: "spotlight-rounds-complete" };

export type LessonIllustration = {
  emoji?: string;
  label?: string;
  alt?: string;
  /** Public URL path from the illustration registry (e.g. `/assets/illustrations/...`). */
  src?: string;
  /** Multiplier vs the viewport-capped slot max-height (1 = default). Use 0.6 to shrink further. */
  scale?: number;
};

export type DeclarativeScreenFields = {
  authoring?: ScreenAuthoringMeta;
  advance?: AdvancePolicy;
  /** Bold call-to-action line under the intro/prompt. */
  cta?: string;
  /** Optional scene illustration shown below lesson chrome, above prompt copy. */
  illustration?: LessonIllustration;
  /** Registry key for a reusable asset under `public/assets/illustrations/`. */
  illustrationId?: IllustrationId;
  /**
   * Authoring sheet image for this cohort.
   * A file name loads `public/assets/illustrations/characters/pairs/` and
   * replaces `illustrationId`. `false` shows no picture. Omit to keep the
   * lesson's existing illustration.
   */
  pairImage?: string | false;
  /** Spreadsheet Screen cell for this row, such as `4-alt`. */
  sourceLabel?: string;
  /** `CONTINUE → GO Screen` target, including screens that also have choices. */
  continueToLabel?: string;
  /** Index of `continueToLabel` in this lesson's screen list. */
  continueToIndex?: number;
  /** Skill-hub section. Marked done when play returns to the hub. */
  hubSkillKey?: string;
  /** This screen is the skill menu. */
  skillHub?: boolean;
};

export type WithDeclarative<T> = T & DeclarativeScreenFields;
