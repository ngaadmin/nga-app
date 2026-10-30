import { copyMatrix } from "@/constants/copyMatrix";

/** Heading on the parent approval-link result screen. */
export function parentLinkResultHeading(result: "declined" | "unavailable"): string {
  if (result === "declined") return copyMatrix.onboarding.parentDecline.declinedTitle;
  return "Parent link unavailable";
}
