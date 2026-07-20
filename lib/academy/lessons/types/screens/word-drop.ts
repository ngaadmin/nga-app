import type { WithDeclarative } from "../declarative";

export type WordDropScreenConfig = WithDeclarative<{
  type: "word-drop";
  id: string;
  narrativeBefore: string;
  narrativeAfter: string;
  options: readonly string[];
  correctOption: string;
  wrongError: string;
  promptLabel?: string;
  /** Multi-blank prompt with [blank] tokens */
  prompt?: string;
  blanks?: readonly {
    options: readonly string[];
    correctOption: string;
  }[];
  successMessage?: string;
}>;
