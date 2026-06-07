export type SkillNodeStatus = "active" | "locked" | "completed";

export type SkillNodeState = {
  id: string;
  status: SkillNodeStatus;
  progressPercent?: number;
};

/** Placeholder dashboard home metrics — wire to centralized state engines later. */
export const DASHBOARD_HOME_PLACEHOLDER_STATE = {
  totalPoints: 1500,
  dayStreak: 0,
  streakFreezes: 2,
  skillNodes: [
    { id: "cash-stash", status: "active", progressPercent: 35 },
    { id: "leveling-up-loot", status: "locked" },
    { id: "interest-multiplier", status: "locked" },
    { id: "goal-crusher", status: "locked" },
    { id: "scammer-defense", status: "locked" },
  ],
} as const satisfies {
  totalPoints: number;
  dayStreak: number;
  streakFreezes: number;
  skillNodes: readonly SkillNodeState[];
};
