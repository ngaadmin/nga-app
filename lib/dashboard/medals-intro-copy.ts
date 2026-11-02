import { copyMatrix } from "@/constants/copyMatrix";

/** Same card as the hub intros. Body stays the old cup tip, word for word. */
export const medalsIntroCopy = {
  title: "Achievements",
  body: copyMatrix.dashboard.academy.journey.skillsCupTip,
  /** Same "Got it" for every role, guest included, first visit or info tap. */
  firstVisitCta: "Got it",
  infoCta: "Got it",
  infoButtonAriaLabel: "About achievements",
} as const;
