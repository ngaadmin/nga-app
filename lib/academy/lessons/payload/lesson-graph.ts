import type { ScreenConfig } from "@/lib/academy/lessons/types";

/** Spreadsheet Screen cell, reduced the same way the linker matches GO targets. */
export function screenLabelKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** `4` and `4-alt` share a beat. `4` and `5` do not. */
export function screenBranchBase(label: string): string {
  const match = /^(\d+)/.exec(label.trim());
  return match?.[1] ?? screenLabelKey(label);
}

export function isSiblingBranchLabel(left: string, right: string): boolean {
  return left !== right && screenBranchBase(left) === screenBranchBase(right);
}

type NavOption = {
  goToIndex?: number;
  goToLabel?: string;
  requiresHubSkills?: readonly string[];
};

type NavScreen = {
  type: string;
  continueToIndex?: number;
  hubSkillKey?: string;
  skillHub?: boolean;
  options?: readonly NavOption[];
};

export type ScreenEdge = {
  to: number;
  requiresHubSkills?: readonly string[];
};

/** Next index when a screen has no explicit GO, skipping sibling branch rows. */
export function implicitNextIndex(index: number, labels: readonly string[]): number {
  let next = index + 1;
  const label = labels[index] ?? "";
  while (next < labels.length && isSiblingBranchLabel(label, labels[next] ?? "")) {
    next += 1;
  }
  return Math.min(next, Math.max(0, labels.length - 1));
}

/**
 * Where Next goes when the chosen button has no GO of its own.
 * Undefined means the following row (index + 1).
 */
export function fallbackNextIndex(
  screen: ScreenConfig,
  index: number,
  labels: readonly string[],
): number | undefined {
  const nav = asNav(screen);
  if (typeof nav.continueToIndex === "number") return nav.continueToIndex;
  const implicit = implicitNextIndex(index, labels);
  // The last row clamps onto itself. That is not a destination. Next
  // finishes the lesson or leaves, instead of pressing the same screen again.
  if (implicit === index) return undefined;
  if (implicit !== index + 1) return implicit;
  return undefined;
}

/** Every screen a player can open from this one, including a sibling-safe fall-through. */
export function screenEdges(
  screen: ScreenConfig,
  index: number,
  labels: readonly string[],
): ScreenEdge[] {
  const nav = asNav(screen);
  const options = nav.options ?? [];
  const edges: ScreenEdge[] = [];
  let missingGo = options.length === 0;

  for (const option of options) {
    if (typeof option.goToIndex === "number") {
      edges.push({
        to: option.goToIndex,
        ...(option.requiresHubSkills ? { requiresHubSkills: option.requiresHubSkills } : {}),
      });
    } else {
      missingGo = true;
    }
  }

  if (missingGo && nav.type !== "completion") {
    const fallback =
      typeof nav.continueToIndex === "number"
        ? nav.continueToIndex
        : implicitNextIndex(index, labels);
    if (fallback !== index && !edges.some((edge) => edge.to === fallback && !edge.requiresHubSkills)) {
      edges.push({ to: fallback });
    }
  }

  return edges;
}

function asNav(screen: ScreenConfig): NavScreen {
  const options =
    "options" in screen && Array.isArray(screen.options)
      ? screen.options.filter(
          (option): option is NavOption =>
            typeof option === "object" && option !== null && "label" in option,
        )
      : undefined;
  return {
    type: screen.type,
    ...("continueToIndex" in screen ? { continueToIndex: screen.continueToIndex } : {}),
    ...("hubSkillKey" in screen ? { hubSkillKey: screen.hubSkillKey } : {}),
    ...("skillHub" in screen ? { skillHub: screen.skillHub } : {}),
    ...(options ? { options } : {}),
  };
}

type WalkState = { index: number; done: string };

function doneKey(done: readonly string[]): string {
  return [...done].sort().join("|");
}

function withSkill(done: readonly string[], skill: string | undefined, enteringHub: boolean): string[] {
  if (!enteringHub || !skill || done.includes(skill)) return [...done];
  return [...done, skill];
}

function edgesFromState(
  screens: readonly ScreenConfig[],
  labels: readonly string[],
  state: WalkState,
): WalkState[] {
  const screen = screens[state.index];
  if (!screen || screen.type === "completion") return [];
  const done = state.done ? state.done.split("|").filter(Boolean) : [];
  const next: WalkState[] = [];
    for (const edge of screenEdges(screen, state.index, labels)) {
    if (edge.requiresHubSkills?.some((key) => !done.includes(key))) continue;
    const dest = screens[edge.to];
    const enteringHub = Boolean(dest && "skillHub" in dest && dest.skillHub);
    const nextDone = withSkill(done, screen.hubSkillKey, enteringHub);
    next.push({ index: edge.to, done: doneKey(nextDone) });
  }
  return next;
}

/** Shortest number of screens on a walk from the start to a completion screen. */
export function shortestCompletionLength(
  screens: readonly ScreenConfig[],
  labels: readonly string[],
): number | undefined {
  const queue: { state: WalkState; steps: number }[] = [
    { state: { index: 0, done: "" }, steps: 1 },
  ];
  const seen = new Set<string>(["0|"]);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const screen = screens[current.state.index];
    if (screen?.type === "completion") return current.steps;
    for (const next of edgesFromState(screens, labels, current.state)) {
      const key = `${next.index}|${next.done}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ state: next, steps: current.steps + 1 });
    }
  }
  return undefined;
}

function reachableIndexes(
  screens: readonly ScreenConfig[],
  labels: readonly string[],
  start: number,
): Set<number> {
  const seen = new Set<number>();
  const queue = [start];
  while (queue.length > 0) {
    const index = queue.shift();
    if (index === undefined || seen.has(index)) continue;
    seen.add(index);
    const screen = screens[index];
    if (!screen) continue;
    for (const edge of screenEdges(screen, index, labels)) {
      if (!seen.has(edge.to)) queue.push(edge.to);
    }
  }
  return seen;
}

function hasCycle(screens: readonly ScreenConfig[], labels: readonly string[]): boolean {
  const color = new Map<number, number>();
  const visit = (index: number): boolean => {
    const mark = color.get(index) ?? 0;
    if (mark === 1) return true;
    if (mark === 2) return false;
    color.set(index, 1);
    const screen = screens[index];
    if (screen) {
      for (const edge of screenEdges(screen, index, labels)) {
        if (visit(edge.to)) return true;
      }
    }
    color.set(index, 2);
    return false;
  };
  for (let index = 0; index < screens.length; index += 1) {
    if (visit(index)) return true;
  }
  return false;
}

export type LessonNavigationIssue = {
  code: "unreachable" | "dead-end" | "cycle" | "no-completion";
  detail: string;
};

/**
 * Structural checks for one resolved lesson.
 * A skill hub may return to itself. Every other lesson must be acyclic,
 * and every screen must be able to reach completion.
 */
export function lessonNavigationIssues(
  screens: readonly ScreenConfig[],
  labels: readonly string[],
): LessonNavigationIssue[] {
  const issues: LessonNavigationIssue[] = [];
  if (!screens.some((screen) => screen.type === "completion")) {
    issues.push({ code: "no-completion", detail: "Lesson has no completion screen." });
    return issues;
  }

  const reachable = reachableIndexes(screens, labels, 0);
  labels.forEach((label, index) => {
    if (!reachable.has(index)) {
      issues.push({ code: "unreachable", detail: `Screen ${label} is not reachable from the start.` });
    }
  });

  for (const index of reachable) {
    const fromHere = reachableIndexes(screens, labels, index);
    const canFinish = [...fromHere].some((candidate) => screens[candidate]?.type === "completion");
    if (!canFinish) {
      issues.push({
        code: "dead-end",
        detail: `Screen ${labels[index] ?? index} cannot reach completion.`,
      });
    }
  }

  const hub = screens.some((screen) => screen.skillHub);
  if (!hub && hasCycle(screens, labels)) {
    issues.push({ code: "cycle", detail: "Lesson loops without a skill hub." });
  }

  if (hub && shortestCompletionLength(screens, labels) === undefined) {
    issues.push({
      code: "dead-end",
      detail: "Skill hub has no walk that finishes every skill and reaches completion.",
    });
  }

  return issues;
}

/** Bar position for the path the student is actually on. Completion is always full. */
export function pathProgressPercent(
  step: number,
  screenCount: number,
  complete: boolean,
): number {
  if (complete) return 100;
  if (screenCount <= 1) return 0;
  const raw = Math.round((Math.max(0, step) / (screenCount - 1)) * 100);
  return Math.min(99, Math.max(0, raw));
}

export function lessonNeedsPathProgress(
  labels: readonly string[],
  screens: readonly ScreenConfig[],
): boolean {
  if (screens.some((screen) => screen.skillHub)) return true;
  if (
    labels.some((label, index) =>
      labels.some((other, otherIndex) => otherIndex !== index && isSiblingBranchLabel(label, other)),
    )
  ) {
    return true;
  }
  return screens.some((screen, index) =>
    screenEdges(screen, index, labels).some((edge) => edge.to !== index + 1 && edge.to !== index),
  );
}
