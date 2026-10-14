import type { WithDeclarative } from "../declarative";

/** One thought card in a lightning round. `correct` is the thinking thought. */
export type LightningRoundCard = {
  id: string;
  label: string;
  emoji?: string;
  correct: boolean;
};

/**
 * Two full-width cards per round. The player taps the thought that helps
 * them stop. Other lessons can use this by setting Game Type `lightning-round`
 * and pairing `RUSH` / `THINK` lines in Game Settings.
 */
export type LightningRoundScreenConfig = WithDeclarative<{
  type: "lightning-round";
  id: string;
  prompt: string;
  rounds: readonly {
    cards: readonly [LightningRoundCard, LightningRoundCard];
  }[];
  wrongError?: string;
}>;
