import type { WithDeclarative } from "../declarative";

export type MultipleChoiceOption = {
  label: string;
  isCorrect: boolean;
  /** Option-specific success or error copy; falls back to screen-level messages. */
  feedback?: string;
};

type MultipleChoiceFields = {
  id: string;
  /** Main narrative / question copy */
  prompt: string;
  /** Canonical answer list — render however many items are sent (2, 3, 4, 5, …). */
  options?: readonly MultipleChoiceOption[];
  /** Legacy A–Z fields; used when `options` is omitted. Partial so cohort patches can merge feedback. */
  optionA?: Partial<MultipleChoiceOption>;
  optionB?: Partial<MultipleChoiceOption>;
  optionC?: Partial<MultipleChoiceOption>;
  optionD?: Partial<MultipleChoiceOption>;
  optionE?: Partial<MultipleChoiceOption>;
  optionF?: Partial<MultipleChoiceOption>;
  optionG?: Partial<MultipleChoiceOption>;
  optionH?: Partial<MultipleChoiceOption>;
  wrongError: string;
  successMessage?: string;
  /** inline-red = sentence screen; banner = trap-style toast */
  errorStyle?: "inline-red" | "banner";
  /**
   * Legacy flag. Multi-select is inferred when more than one option has
   * `isCorrect: true` — this field is not required.
   */
  selectionMode?: "single" | "multi-correct";
  /** Scene copy shown above the question (sign / illustration screens). */
  scenePrompt?: string;
  /** Placeholder block for a future scene illustration. */
  imagePlaceholder?: {
    label: string;
    alt?: string;
  };
  /** buttons = default tiles; radio-list = spaced list with large radio indicators. */
  optionLayout?: "buttons" | "radio-list";
  /** When true, correct selections cannot be toggled off (L4 check-questions style). */
  lockCorrectSelections?: boolean;
  /** persist = keep wrong selected (radio-list); shake = transient dud feedback (button list). */
  wrongInteraction?: "persist" | "shake";
  /** neutral-selected = sunken tile only; colored = green/red tiles (default). */
  choiceFeedback?: "colored" | "neutral-selected";
  emphasizeInstruction?: boolean;
};

export type MultipleChoiceScreenConfig = WithDeclarative<
  MultipleChoiceFields & {
    type: "multiple-choice";
  }
>;

/** @deprecated Same template as `multiple-choice`. Kept so shipped lessons keep type-checking. */
export type BinaryChoiceScreenConfig = WithDeclarative<
  MultipleChoiceFields & {
    type: "binary-choice";
  }
>;

export type MultipleChoiceScreen =
  | MultipleChoiceScreenConfig
  | BinaryChoiceScreenConfig;

/** @deprecated Use MultipleChoiceOption */
export type BinaryChoiceOption = MultipleChoiceOption;

export function isMultipleChoiceScreen(
  screen: { type: string },
): screen is MultipleChoiceScreen {
  return screen.type === "multiple-choice" || screen.type === "binary-choice";
}
