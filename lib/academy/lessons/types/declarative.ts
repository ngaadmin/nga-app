import type { ScreenAuthoringMeta } from "./meta";

export type AdvancePolicy =
  | { mode: "on-complete" }
  | { mode: "auto-ready" }
  | { mode: "manual-next" }
  | { mode: "all-taps-revealed" }
  | { mode: "all-items-sorted" }
  | { mode: "spotlight-rounds-complete" }
  | { mode: "validate-on-next"; rules: ValidationRule[] };

export type ValidationRule =
  | {
      kind: "budget-wallet";
      correctIds: string[];
      maxTotal?: number;
      errors?: Record<string, string>;
    }
  | {
      kind: "reserve-slider";
      targetMin: number;
      total?: number;
      errorMessage?: string;
    }
  | {
      kind: "rank-order";
      correctOrder: string[];
      errors?: Record<string, string>;
    }
  | { kind: "all-items-sorted" }
  | { kind: "all-taps-revealed" }
  | { kind: "spotlight-rounds-complete" };

export type DeclarativeScreenFields = {
  authoring?: ScreenAuthoringMeta;
  advance?: AdvancePolicy;
};

export type WithDeclarative<T> = T & DeclarativeScreenFields;
