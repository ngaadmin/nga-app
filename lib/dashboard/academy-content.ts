type AcademyLevelId = 1 | 2 | 3 | 4 | 5 | 6;

/** Module titles shown on the Academy journey map (Modules 1-6). */
export const ACADEMY_MODULE_TITLES: Record<AcademyLevelId, string> = {
  1: "Control Your Spending",
  2: "Start making money",
  3: "Be the boss of your money",
  4: "Grow the money you have",
  5: "Increase your earning power",
  // TODO-M6-NAME: Cath has not confirmed Module 6. Keep this name until she chooses.
  6: "Create Income That Doesn't Need You",
};

/** Short sub-headers shown under each module title. */
export const ACADEMY_MODULE_DESCRIPTIONS: Record<AcademyLevelId, string> = {
  1: "Stop the behaviours and beliefs that keep people stuck in scarcity",
  2: "Create real cash so money stops being theoretical",
  3: "Stop leakage and install a personal operating system",
  4: "Make surplus capital start working",
  5: "Raise the value and efficiency of what you earn",
  6: "Move from trading time for money to ownership",
};

/** @deprecated Use ACADEMY_MODULE_DESCRIPTIONS — retained for imports. */
export const ACADEMY_MODULE_FOCUS_AREAS = ACADEMY_MODULE_DESCRIPTIONS;

/**
 * Fallback lesson topics per module: the three skill names, in order.
 * Lessons 1–9 cycle through these three names.
 */
export const ACADEMY_LESSON_TOPICS_BY_MODULE: Record<
  AcademyLevelId,
  readonly [string, string, string]
> = {
  1: [
    "Catch Impulse Spending",
    "Choose Needs Over Wants",
    "Don't Spend Money You Don't Have",
  ],
  2: [
    "Create Value People Will Pay For",
    "Find & Close Simple Opportunities",
    "Track What You Earn and Spend",
  ],
  3: [
    "Run a Simple Money System",
    "Protect a Safety Buffer",
    "Review Your Numbers",
  ],
  4: [
    "Understand Assets vs Liabilities",
    "Understand Compounding & Starting Young",
    "Put Money to Work",
  ],
  5: [
    "Increase the Value of What You Offer",
    "Expand or Improve Income Streams",
    "Manage Basic Downside Risk in Earning",
  ],
  6: [
    "Spot Where You Are Still the Bottleneck",
    "Design Ownership Instead of Just Work",
    "Replace Yourself with a System, Person or Tool",
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
  5: { fill: "#031F82", shadow: "#021558", ring: "rgba(3, 31, 130, 0.4)" },
  6: { fill: "#DCB766", shadow: "#B8943F", ring: "rgba(220, 183, 102, 0.4)" },
};

/** Lesson 9 closer: completed module node (no skill medal). */
export const ACADEMY_MODULE_CLOSER_THEME = {
  fill: "#FFA503",
  shadow: "#C88202",
  ring: "rgba(255, 165, 3, 0.4)",
} as const;

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
