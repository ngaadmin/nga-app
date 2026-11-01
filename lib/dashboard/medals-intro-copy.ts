import { copyMatrix } from "@/constants/copyMatrix";

/** Same card as the hub intros. Body stays the old cup tip, word for word. */
export const medalsIntroCopy = {
  title: "Achievements",
  body: copyMatrix.dashboard.academy.journey.skillsCupTip,
  firstVisitCta: "Let's go",
  infoCta: "Got it",
  infoButtonAriaLabel: "About achievements",
} as const;
