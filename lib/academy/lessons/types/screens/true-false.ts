import type { WithDeclarative } from "../declarative";

export type TrueFalseScreenConfig = WithDeclarative<{
  type: "true-false";
  id: string;
  prompt: string;
  correctAnswer: "true" | "false";
  wrongError: string;
  promptLabel?: string;
  choiceFeedback?: "colored" | "neutral-selected";
  emphasizeInstruction?: boolean;
}>;
