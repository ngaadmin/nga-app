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
};

export type DeclarativeScreenFields = {
  authoring?: ScreenAuthoringMeta;
  advance?: AdvancePolicy;
  /** Optional scene illustration shown below lesson chrome, above prompt copy. */
  illustration?: LessonIllustration;
};

export type WithDeclarative<T> = T & DeclarativeScreenFields;
