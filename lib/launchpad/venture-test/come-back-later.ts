/**
 * TEST-ONLY copy for "Come back to this later" (a task the learner leaves
 * open and finishes before the silver's wrap-up). Wording in one place:
 * the home tile's wording can change in one place.
 */

/** Home In Progress tile line under the level name: open tasks across the business, e.g. "2 open". Hidden at 0. */
export const OPEN_TASKS_LABEL = (count: number): string => `${count} open`;

export const COME_BACK_LATER_COPY = {
  /** Secondary button under the workbook's primary button. */
  button: "Come back to this later",
  /** Orange marker on the door and the corridor plaque of an open task. */
  marker: "Come back",
  /** Link beside each open step on a blocked wrap-up. */
  finishThis: "Finish this",
  wrapUpListHeading: "Still to finish",
  /** Link on each open task row in the expanded home tile. */
  go: "Go",
  /** Why Confirm and continue is off on a wrap-up with open steps. */
  wrapUpBlocked: (count: number): string =>
    count === 1 ? "Finish the step above to confirm and continue." : `Finish the ${count} steps above to confirm and continue.`,
} as const;
