type JourneyStepStatus = "completed" | "active" | "locked";

type JourneyStep = {
  status: JourneyStepStatus;
};

type JourneyStepWithId = JourneyStep & {
  id: number;
};

export function resolveActiveStepIndex(
  steps: readonly JourneyStep[],
): number {
  for (let index = 0; index < steps.length; index += 1) {
    if (steps[index]?.status === "active") return index;
  }

  let lastCompleted = 0;
  for (let index = 0; index < steps.length; index += 1) {
    if (steps[index]?.status === "completed") lastCompleted = index;
  }

  return lastCompleted;
}

/** Single continue target — next lesson after the highest completed step. */
export function resolveContinueMilestoneId(
  steps: readonly JourneyStepWithId[],
): number | null {
  if (steps.length === 0) return null;

  let highestCompletedId = 0;
  for (const step of steps) {
    if (step.status === "completed" && step.id > highestCompletedId) {
      highestCompletedId = step.id;
    }
  }

  const expectedContinueId =
    highestCompletedId > 0 ? highestCompletedId + 1 : steps[0]!.id;

  if (steps.some((step) => step.id === expectedContinueId)) {
    return expectedContinueId;
  }

  for (const step of steps) {
    if (step.status === "active") return step.id;
  }

  return steps[0]?.id ?? null;
}

/**
 * Tile Penny stands beside: the next lesson, or the last tile once every
 * lesson is already done. A finished journey still has a tile to stand on.
 */
export function resolvePennyMilestoneId(
  steps: readonly JourneyStepWithId[],
): number | null {
  if (steps.length === 0) return null;
  if (steps.every((step) => step.status === "completed")) {
    return steps[steps.length - 1]!.id;
  }

  const continueId = resolveContinueMilestoneId(steps);
  const continueStep = steps.find((step) => step.id === continueId);
  if (continueStep && continueStep.status !== "completed") return continueStep.id;

  const active = steps.find((step) => step.status === "active");
  if (active) return active.id;

  const open = steps.find((step) => step.status !== "completed");
  return (open ?? steps[steps.length - 1]!).id;
}
