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
