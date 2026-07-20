import type { WithDeclarative } from "../declarative";

export type SpotlightRoundsScreenConfig = WithDeclarative<{
  type: "spotlight-rounds";
  id: string;
  prompt: string;
  rounds: readonly {
    iconA: string;
    optionA: string;
    iconB: string;
    optionB: string;
    correct: "a" | "b";
    error: string;
  }[];
}>;
