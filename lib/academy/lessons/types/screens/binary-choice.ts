import type { WithDeclarative } from "../declarative";

export type BinaryChoiceOption = {
  label: string;
  isCorrect: boolean;
  /** Option-specific success or error copy; falls back to screen-level messages. */
  feedback?: string;
};

export type BinaryChoiceScreenConfig = WithDeclarative<{
  type: "binary-choice";
  id: string;
  /** Main narrative / question copy */
  prompt: string;
  optionA: BinaryChoiceOption;
  optionB: BinaryChoiceOption;
  optionC?: BinaryChoiceOption;
  optionD?: BinaryChoiceOption;
  optionE?: BinaryChoiceOption;
  wrongError: string;
  successMessage?: string;
  /** inline-red = sentence screen; banner = trap-style toast */
  errorStyle?: "inline-red" | "banner";
  /** Lock each correct option until all are selected (L4 pressure-sign style). */
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
}>;
