import { copyMatrix } from "@/constants/copyMatrix";

type AcademyLevelId = 1 | 2 | 3 | 4 | 5 | 6;

/** Module titles aligned with copyMatrix journey nodes (Modules 1–6). */
export const ACADEMY_MODULE_TITLES: Record<AcademyLevelId, string> = {
  1: copyMatrix.dashboard.academy.journey.nodes[0]?.subtitle ?? "Understanding the Money Game",
  2: copyMatrix.dashboard.academy.journey.nodes[1]?.subtitle ?? "Protecting Your Money",
  3: copyMatrix.dashboard.academy.journey.nodes[2]?.subtitle ?? "Commanding Your Cash",
  4:
    copyMatrix.dashboard.academy.journey.nodes[3]?.subtitle ??
    "Generating Your Income",
  5: copyMatrix.dashboard.academy.journey.nodes[4]?.subtitle ?? "Multiplying Your Wealth",
  6:
    copyMatrix.dashboard.academy.journey.nodes[5]?.subtitle ??
    "Mastering the System",
};

/** Module descriptions shown on Academy intro signposts (Modules 1–6). */
export const ACADEMY_MODULE_DESCRIPTIONS: Record<AcademyLevelId, string> = {
  1:
    copyMatrix.dashboard.academy.journey.nodes[0]?.focusAreas ??
    "How your daily spending choices shape your freedom and future.",
  2:
    copyMatrix.dashboard.academy.journey.nodes[1]?.focusAreas ??
    "Stop money from quietly slipping away.",
  3:
    copyMatrix.dashboard.academy.journey.nodes[2]?.focusAreas ??
    "Build a system that puts you in control.",
  4:
    copyMatrix.dashboard.academy.journey.nodes[3]?.focusAreas ??
    "Create extra money with skills you have.",
  5:
    copyMatrix.dashboard.academy.journey.nodes[4]?.focusAreas ??
    "Make your money work for you.",
  6:
    copyMatrix.dashboard.academy.journey.nodes[5]?.focusAreas ??
    "Unlock how the wealthy stay ahead.",
};

/** @deprecated Use ACADEMY_MODULE_DESCRIPTIONS — retained for imports. */
export const ACADEMY_MODULE_FOCUS_AREAS = ACADEMY_MODULE_DESCRIPTIONS;

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
