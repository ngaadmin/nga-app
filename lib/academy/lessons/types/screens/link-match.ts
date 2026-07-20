import type { WithDeclarative } from "../declarative";

export type LinkMatchPair = {
  id: string;
  event: string;
  benefit: string;
};

export type LinkMatchScreenConfig = WithDeclarative<{
  type: "link-match";
  id: string;
  intro: string;
  pairs: readonly LinkMatchPair[];
  eventColumnLabel?: string;
  benefitColumnLabel?: string;
  wrongError?: string;
  submitLabel?: string;
  successMessage?: string;
}>;
