/** Heading on the parent approval-link result screen. */
export function parentLinkResultHeading(result: "declined" | "unavailable"): string {
  if (result === "declined") return "Account not approved";
  return "Parent link unavailable";
}
