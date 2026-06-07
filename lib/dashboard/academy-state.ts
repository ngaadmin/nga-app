export type AcademyNodeStatus = "active" | "locked" | "completed";

export type AcademyNodeState = {
  id: string;
  status: AcademyNodeStatus;
  progressPercent?: number;
};

/** Placeholder Academy journey metrics — wire to centralized state engines later. */
export const ACADEMY_JOURNEY_PLACEHOLDER_STATE = {
  dayStreak: 0,
  xp: 0,
  nodes: [
    { id: "cash-stash", status: "completed" },
    { id: "leveling-up-loot", status: "completed" },
    { id: "interest-multiplier", status: "active", progressPercent: 0 },
    { id: "goal-crusher", status: "locked" },
    { id: "scammer-defense", status: "locked" },
    { id: "savings-streak", status: "locked" },
  ],
} as const satisfies {
  dayStreak: number;
  xp: number;
  nodes: readonly AcademyNodeState[];
};
