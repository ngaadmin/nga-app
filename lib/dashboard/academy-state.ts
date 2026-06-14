import { copyMatrix } from "@/constants/copyMatrix";

export type AcademyNodeStatus = "active" | "locked" | "completed";

/** One high-level map node — kept for the existing 6-node journey UI. */
export type AcademyNodeState = {
  id: string;
  status: AcademyNodeStatus;
  progressPercent?: number;
};

/** Phase 1 is 6 levels with 9 lesson milestones each (54 nodes total). */
export type AcademyLevelId = 1 | 2 | 3 | 4 | 5 | 6;

export const LESSONS_PER_LEVEL = 9;

export const PHASE_1_LEVEL_COUNT = 6;

export const PHASE_1_MILESTONE_COUNT = 54;

/** Module titles aligned with copyMatrix journey nodes (Modules 1–6). */
export const ACADEMY_MODULE_TITLES: Record<AcademyLevelId, string> = {
  1: copyMatrix.dashboard.academy.journey.nodes[0]?.subtitle ?? "The Cash Stash",
  2:
    copyMatrix.dashboard.academy.journey.nodes[1]?.subtitle ??
    "Leveling Up Your Loot",
  3:
    copyMatrix.dashboard.academy.journey.nodes[2]?.subtitle ??
    "The Interest Multiplier",
  4:
    copyMatrix.dashboard.academy.journey.nodes[3]?.subtitle ??
    "Goal Crusher: Console Quest",
  5:
    copyMatrix.dashboard.academy.journey.nodes[4]?.subtitle ??
    "Scammer Defense Shield",
  6:
    copyMatrix.dashboard.academy.journey.nodes[5]?.subtitle ??
    "Savings Streak Builder",
};

/**
 * Fallback lesson topic strings per module (Lessons 1–9).
 * Lesson 9 is the phase-closer checkpoint for each module.
 */
export const ACADEMY_LESSON_TOPICS_BY_MODULE: Record<
  AcademyLevelId,
  readonly [string, string, string, string, string, string, string, string, string]
> = {
  1: [
    "Money In, Money Out",
    "Needs vs Wants Sort",
    "The 50/30/20 Split",
    "Pocket Money Map",
    "Track Every Coin",
    "Save-First Power",
    "Spending Triggers",
    "Stash Audit",
    "Cash Stash Checkpoint",
  ],
  2: [
    "Income Sources 101",
    "Side Hustle Spark",
    "Value Your Time",
    "Pricing Your Skills",
    "Negotiation Basics",
    "Raise Your Rates",
    "Passive Income Intro",
    "Loot Leverage Review",
    "Loot Level Checkpoint",
  ],
  3: [
    "Interest Explained",
    "Compound Growth",
    "APR vs APY",
    "Savings Account Power",
    "Rule of 72",
    "Inflation Reality Check",
    "Time Value of Money",
    "Multiplier Math Lab",
    "Interest Checkpoint",
  ],
  4: [
    "Set a Real Goal",
    "Break Goals Into Steps",
    "Console Quest Budget",
    "Trade-Off Decisions",
    "Delay Gratification",
    "Goal Timeline Map",
    "Progress Check Ritual",
    "Crush the Milestone",
    "Goal Crusher Checkpoint",
  ],
  5: [
    "Spot the Red Flags",
    "Phishing & Fake Links",
    "Too-Good-To-Be-True Offers",
    "Password & Privacy Basics",
    "Social Media Scams",
    "In-App Purchase Traps",
    "Report & Block Playbook",
    "Defense Drill",
    "Scam Shield Checkpoint",
  ],
  6: [
    "Build the Streak Habit",
    "Weekly Save Challenge",
    "Automate Your Stash",
    "Celebrate Small Wins",
    "Streak Recovery Plan",
    "Long-Term Consistency",
    "Streak + Goal Combo",
    "Final Push Review",
    "Savings Streak Checkpoint",
  ],
};

export type AcademyContextBannerState = {
  moduleNumber: AcademyLevelId;
  lessonNumber: number;
  topic: string;
  label: string;
};

/** Lesson index 1–9 inside a module from a global milestone id. */
export function lessonNumberForMilestoneId(milestoneId: number): number {
  const clamped = Math.min(
    PHASE_1_MILESTONE_COUNT,
    Math.max(1, Math.floor(milestoneId)),
  );
  return ((clamped - 1) % LESSONS_PER_LEVEL) + 1;
}

/** Resolve the lesson topic fallback for a milestone position. */
export function academyLessonTopicForMilestone(
  milestone: AcademyLessonMilestoneNode | null | undefined,
): string {
  if (!isRenderableAcademyMilestone(milestone)) {
    return ACADEMY_LESSON_TOPICS_BY_MODULE[1][0];
  }

  const lessonNumber = lessonNumberForMilestoneId(milestone.id);
  const topics = ACADEMY_LESSON_TOPICS_BY_MODULE[milestone.levelGroup];
  return topics[lessonNumber - 1] ?? ACADEMY_MODULE_TITLES[milestone.levelGroup];
}

/** Pick the user's current structural position from the milestone scaffold. */
export function resolveActiveAcademyMilestone(
  milestones: readonly AcademyLessonMilestoneNode[],
): AcademyLessonMilestoneNode | null {
  const safe = milestones.filter(isRenderableAcademyMilestone);
  if (safe.length === 0) return null;

  const active = safe.find((node) => node.status === "active");
  if (active) return active;

  const lastCompleted = [...safe]
    .reverse()
    .find((node) => node.status === "completed");
  if (lastCompleted) return lastCompleted;

  return safe[0] ?? null;
}

/** Build the banner copy: "Module X, Lesson Y: Z". */
export function resolveAcademyContextBanner(
  milestones: readonly AcademyLessonMilestoneNode[],
): AcademyContextBannerState {
  const milestone = resolveActiveAcademyMilestone(milestones);
  const moduleNumber = milestone?.levelGroup ?? 1;
  const lessonNumber = milestone
    ? lessonNumberForMilestoneId(milestone.id)
    : 1;
  const topic = academyLessonTopicForMilestone(milestone);

  return {
    moduleNumber,
    lessonNumber,
    topic,
    label: `Module ${moduleNumber}, Lesson ${lessonNumber}: ${topic}`,
  };
}

/** Distinct phase colors for each Academy level block (Duolingo-style map). */
export const ACADEMY_LEVEL_PHASE_THEME: Record<
  AcademyLevelId,
  { fill: string; shadow: string; ring: string }
> = {
  1: { fill: "#0CC1E0", shadow: "#099FB8", ring: "rgba(12, 193, 224, 0.4)" },
  2: { fill: "#22C55E", shadow: "#15803D", ring: "rgba(34, 197, 94, 0.4)" },
  3: { fill: "#FFA503", shadow: "#C88202", ring: "rgba(255, 165, 3, 0.4)" },
  4: { fill: "#6366F1", shadow: "#4338CA", ring: "rgba(99, 102, 241, 0.4)" },
  5: { fill: "#8B5CF6", shadow: "#6D28D9", ring: "rgba(139, 92, 246, 0.4)" },
  6: { fill: "#DCB766", shadow: "#B8943F", ring: "rgba(220, 183, 102, 0.4)" },
};

export type AcademyLessonIconKind =
  | "target"
  | "lightbulb"
  | "sparkles"
  | "zap"
  | "trending-up"
  | "trophy";

const REGULAR_LESSON_ICON_SEQUENCE: readonly AcademyLessonIconKind[] = [
  "target",
  "lightbulb",
  "sparkles",
  "zap",
  "trending-up",
];

/** True on the 9th node of each phase in a 0-based loop (ids 9, 18, 27, 36, 45, 54). */
export function isPhaseCloserByIndex(index: number): boolean {
  return (index + 1) % LESSONS_PER_LEVEL === 0;
}

const DEFAULT_PHASE_THEME = ACADEMY_LEVEL_PHASE_THEME[1];

/** Safe phase theme lookup — never returns undefined. */
export function getAcademyPhaseTheme(levelGroup: AcademyLevelId) {
  return ACADEMY_LEVEL_PHASE_THEME[levelGroup] ?? DEFAULT_PHASE_THEME;
}

/** Runtime guard for map rendering — rejects nullish or malformed nodes. */
export function isRenderableAcademyMilestone(
  milestone: AcademyLessonMilestoneNode | null | undefined,
): milestone is AcademyLessonMilestoneNode {
  if (!milestone) return false;
  return (
    Number.isFinite(milestone.id) &&
    milestone.id > 0 &&
    milestone.id <= PHASE_1_MILESTONE_COUNT &&
    (milestone.status === "active" ||
      milestone.status === "completed" ||
      milestone.status === "locked") &&
    milestone.levelGroup >= 1 &&
    milestone.levelGroup <= PHASE_1_LEVEL_COUNT
  );
}

/** Phase closer by milestone id — last node in each 9-lesson block. */
export function isPhaseCloserMilestone(
  milestone: AcademyLessonMilestoneNode | null | undefined,
): boolean {
  if (!isRenderableAcademyMilestone(milestone)) return false;
  return isBossMilestoneId(milestone.id);
}

/** Maps a regular lesson to a high-agency icon. Trophies are UI-only via isPhaseCloserMilestone. */
export function lessonIconKindForMilestone(
  milestone: AcademyLessonMilestoneNode | null | undefined,
): AcademyLessonIconKind {
  if (!isRenderableAcademyMilestone(milestone)) return "target";
  const lessonIndex = (milestone.id - 1) % LESSONS_PER_LEVEL;
  const sequenceIndex =
    (lessonIndex + (milestone.levelGroup - 1)) %
    REGULAR_LESSON_ICON_SEQUENCE.length;
  return REGULAR_LESSON_ICON_SEQUENCE[sequenceIndex] ?? "target";
}

/**
 * One lesson milestone on the continuous Phase 1 path (1–54).
 * Nodes 1–9 = Level 1, 10–18 = Level 2, … 46–54 = Level 6.
 */
export type AcademyLessonMilestoneNode = {
  /** Sequential milestone id from 1 to 54. */
  id: number;
  status: AcademyNodeStatus;
  /** Thematic level block this milestone belongs to (1–6). */
  levelGroup: AcademyLevelId;
  /** True only on the 9th node of each level (ids 9, 18, 27, 36, 45, 54). */
  isBossNode: boolean;
};

/**
 * Maps each Level (1–6) to the copyMatrix journey node id used by the legacy map UI.
 */
export const LEVEL_MAP_NODE_IDS: readonly [
  string,
  string,
  string,
  string,
  string,
  string,
] = [
  "cash-stash",
  "leveling-up-loot",
  "interest-multiplier",
  "goal-crusher",
  "scammer-defense",
  "savings-streak",
] as const;

/** Tracks where the user is inside a Level's 9-lesson sequence. */
export type AcademyLevelLessonProgress = {
  activeLessonIndex: number;
  completedLessonCount: number;
};

/** One Level summary derived from its 9 milestone nodes. */
export type AcademyLevelState = {
  levelId: AcademyLevelId;
  status: AcademyNodeStatus;
  lessons: AcademyLevelLessonProgress;
};

/** Return which level block (1–6) a milestone id belongs to. */
export function levelGroupForMilestoneId(milestoneId: number): AcademyLevelId {
  const clamped = Math.min(
    PHASE_1_MILESTONE_COUNT,
    Math.max(1, Math.floor(milestoneId)),
  );
  return Math.ceil(clamped / LESSONS_PER_LEVEL) as AcademyLevelId;
}

/** Phase closers are the 9th node in each block (ids 9, 18, 27, 36, 45, 54). */
export function isBossMilestoneId(milestoneId: number): boolean {
  return (
    milestoneId > 0 &&
    milestoneId <= PHASE_1_MILESTONE_COUNT &&
    milestoneId % LESSONS_PER_LEVEL === 0
  );
}

/** Build one milestone node with the correct level group and boss flag. */
export function createMilestoneNode(
  id: number,
  status: AcademyNodeStatus,
): AcademyLessonMilestoneNode {
  return {
    id,
    status,
    levelGroup: levelGroupForMilestoneId(id),
    isBossNode: isBossMilestoneId(id),
  };
}

/** Create all 54 Phase 1 milestones. Pass the active id; everything before is completed, after is locked. */
export function createPhase1MilestoneScaffold(
  activeMilestoneId: number = 1,
): AcademyLessonMilestoneNode[] {
  const clampedActive = Number.isFinite(activeMilestoneId)
    ? Math.min(
        PHASE_1_MILESTONE_COUNT,
        Math.max(1, Math.floor(activeMilestoneId)),
      )
    : 1;

  return Array.from({ length: PHASE_1_MILESTONE_COUNT }, (_, index) => {
    const id = index + 1;
    let status: AcademyNodeStatus = "locked";

    if (id < clampedActive) {
      status = "completed";
    } else if (id === clampedActive) {
      status = "active";
    }

    return createMilestoneNode(id, status);
  });
}

/**
 * Demo scaffold: Node 12 active for scroll-focus testing.
 * Nodes 1–11 completed, Nodes 13–54 locked.
 */
export function createDemoPhase1Milestones(): AcademyLessonMilestoneNode[] {
  return createPhase1MilestoneScaffold(12);
}

/** Count completed milestones inside one level group. */
export function completedMilestonesInLevel(
  milestones: readonly AcademyLessonMilestoneNode[],
  levelGroup: AcademyLevelId,
): number {
  return milestones.filter(
    (node) => node.levelGroup === levelGroup && node.status === "completed",
  ).length;
}

/** Find the active milestone id in a level, or null if none. */
export function activeMilestoneInLevel(
  milestones: readonly AcademyLessonMilestoneNode[],
  levelGroup: AcademyLevelId,
): number | null {
  const active = milestones.find(
    (node) => node.levelGroup === levelGroup && node.status === "active",
  );
  return active?.id ?? null;
}

/** Roll up milestone progress into a single level status for legacy UI. */
export function deriveLevelStatusFromMilestones(
  milestones: readonly AcademyLessonMilestoneNode[],
  levelGroup: AcademyLevelId,
): AcademyNodeStatus {
  const group = milestones.filter((node) => node.levelGroup === levelGroup);
  if (group.length === 0) return "locked";

  if (group.every((node) => node.status === "completed")) {
    return "completed";
  }

  if (group.some((node) => node.status === "active")) {
    return "active";
  }

  if (group.some((node) => node.status === "completed")) {
    return "active";
  }

  return "locked";
}

/** Build level summaries from the 54-node master list. */
export function deriveLevelsFromMilestones(
  milestones: readonly AcademyLessonMilestoneNode[],
): AcademyLevelState[] {
  return ([1, 2, 3, 4, 5, 6] as const).map((levelId) => {
    const completedLessonCount = completedMilestonesInLevel(milestones, levelId);
    const activeId = activeMilestoneInLevel(milestones, levelId);
    const activeLessonIndex =
      activeId !== null
        ? ((activeId - 1) % LESSONS_PER_LEVEL) + 1
        : completedLessonCount >= LESSONS_PER_LEVEL
          ? LESSONS_PER_LEVEL
          : Math.min(completedLessonCount + 1, LESSONS_PER_LEVEL);

    return {
      levelId,
      status: deriveLevelStatusFromMilestones(milestones, levelId),
      lessons: {
        activeLessonIndex,
        completedLessonCount,
      },
    };
  });
}

export function lessonProgressPercent(
  lessons: AcademyLevelLessonProgress,
): number {
  return Math.round((lessons.completedLessonCount / LESSONS_PER_LEVEL) * 100);
}

/** Build legacy 6-node map rows from level summaries. */
export function mapLevelsToNodes(
  levels: readonly AcademyLevelState[],
): AcademyNodeState[] {
  return levels.map((level) => {
    const id = LEVEL_MAP_NODE_IDS[level.levelId - 1] ?? `level-${level.levelId}`;

    let progressPercent: number | undefined;
    if (level.status === "completed") {
      progressPercent = 100;
    } else if (level.status === "active") {
      progressPercent = lessonProgressPercent(level.lessons);
    }

    return {
      id,
      status: level.status,
      progressPercent,
    };
  });
}

/** Master 54-node Phase 1 path — primary source of truth for journey progress. */
export const ACADEMY_PHASE_1_MILESTONES: readonly AcademyLessonMilestoneNode[] =
  createDemoPhase1Milestones();

/** Level summaries derived from the 54-node master list. */
export const ACADEMY_PHASE_1_LEVELS: readonly AcademyLevelState[] =
  deriveLevelsFromMilestones(ACADEMY_PHASE_1_MILESTONES);

/** Placeholder Academy journey metrics — wire to centralized state engines later. */
export const ACADEMY_JOURNEY_PLACEHOLDER_STATE = {
  dayStreak: 0,
  xp: 0,
  /** Single continuous list of 54 lesson milestones for the winding map. */
  milestones: ACADEMY_PHASE_1_MILESTONES,
  /** Level roll-ups derived from milestones. */
  levels: ACADEMY_PHASE_1_LEVELS,
  /** Legacy 6-node map rows for the current journey UI. */
  nodes: mapLevelsToNodes(ACADEMY_PHASE_1_LEVELS),
} satisfies {
  dayStreak: number;
  xp: number;
  milestones: readonly AcademyLessonMilestoneNode[];
  levels: readonly AcademyLevelState[];
  nodes: readonly AcademyNodeState[];
};
