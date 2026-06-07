type JourneyStepStatus = "completed" | "active" | "locked";

type JourneyStep = {
  status: JourneyStepStatus;
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
