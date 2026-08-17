type AcademyLevelId = 1 | 2 | 3 | 4 | 5 | 6;

/** Module titles shown on the Academy journey map (Modules 1-6). */
export const ACADEMY_MODULE_TITLES: Record<AcademyLevelId, string> = {
  1: "How the Money Game Works",
  2: "Protecting Your Money",
  3: "Taking Control of Your Money",
  4: "Generating Your Own Income",
  5: "Growing Your Money",
  6: "Structuring & Optimising Your Money",
};

/** Short sub-headers shown under each module title. */
export const ACADEMY_MODULE_DESCRIPTIONS: Record<AcademyLevelId, string> = {
  1: "Money is a tool to buy freedom and choices",
  2: "Money is lost when you can't see what's happening",
  3: "If you don't control money, it controls you",
  4: "Money comes from creating value for others",
  5: "Money grows when it is put to work",
  6: "How you structure money determines how much you keep and grow",
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
  2: { fill: "#8B5CF6", shadow: "#6D28D9", ring: "rgba(139, 92, 246, 0.4)" },
  3: { fill: "#FFA503", shadow: "#C88202", ring: "rgba(255, 165, 3, 0.4)" },
  4: { fill: "#6366F1", shadow: "#4338CA", ring: "rgba(99, 102, 241, 0.4)" },
  5: { fill: "#22C55E", shadow: "#15803D", ring: "rgba(34, 197, 94, 0.4)" },
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
