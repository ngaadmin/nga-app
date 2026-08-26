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
  /** Multiplier vs the default slot max-height (1 = default). Use 0.6 for ~40% smaller. */
  scale?: number;
};

export type DeclarativeScreenFields = {
  authoring?: ScreenAuthoringMeta;
  advance?: AdvancePolicy;
  /** Optional scene illustration shown below lesson chrome, above prompt copy. */
  illustration?: LessonIllustration;
  /** Registry key for a reusable asset under `public/assets/illustrations/`. */
  illustrationId?: IllustrationId;
};

export type WithDeclarative<T> = T & DeclarativeScreenFields;
