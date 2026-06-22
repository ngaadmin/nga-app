export type SkillNodeStatus = "active" | "locked" | "completed";

export type SkillNodeState = {
  id: string;
  status: SkillNodeStatus;
  progressPercent?: number;
};

/** Placeholder dashboard home metrics - wire to centralized state engines later. */
export const DASHBOARD_HOME_PLACEHOLDER_STATE = {
  totalPoints: 1500,
  dayStreak: 0,
  streakFreezes: 2,
    skillNodes: [
      { id: "level-1", status: "active", progressPercent: 35 },
      { id: "level-2", status: "locked" },
      { id: "level-3", status: "locked" },
      { id: "level-4", status: "locked" },
      { id: "level-5", status: "locked" },
      { id: "level-6", status: "locked" },
    ],
} as const satisfies {
  totalPoints: number;
  dayStreak: number;
  streakFreezes: number;
  skillNodes: readonly SkillNodeState[];
};
