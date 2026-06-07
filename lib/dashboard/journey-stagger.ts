export type JourneyStaggerSide = "left" | "right" | "center";

export function cycleStagger(
  pattern: readonly JourneyStaggerSide[],
  index: number,
): JourneyStaggerSide {
  const entry = pattern[index % pattern.length];
  if (entry !== undefined) return entry;
  return pattern[0] ?? "center";
}
