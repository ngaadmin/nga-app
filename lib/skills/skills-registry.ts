/** Canonical 6-level × 3-skill progression registry (18 universal achievements). */

export type SkillLevelId = 1 | 2 | 3 | 4 | 5 | 6;

export type SkillLevelDefinition = {
  levelId: SkillLevelId;
  title: string;
  subtitle: string;
  theme: string;
  isAdvancedCohortOnly: boolean;
};

export type SkillRegistryRecord = {
  /** Auto-incrementing primary key mirror for Supabase `skills_registry.id`. */
  id: number;
  /** Core progression level (1–6). Each level contains exactly 3 sequential skills. */
  levelId: SkillLevelId;
  skillNumber: number;
  /** Stable URL-safe identifier used in app code and user progress rows. */
  skillSlug: string;
  skillName: string;
  description: string;
  /** Skills 13–18 — restricted to Mavericks (ages 16–18). Levels 5–6. */
  isAdvancedCohortOnly: boolean;
  /** Optional legacy slugs from pre-registry prototypes (lesson + vault keys). */
  legacySlugs?: readonly string[];
  medalEmoji: string;
};

export const SKILLS_LEVELS: readonly SkillLevelDefinition[] = [
  {
    levelId: 1,
    title: "How the Money Game Works",
    subtitle: "Money is a tool to buy freedom and choices",
    theme: "Awareness",
    isAdvancedCohortOnly: false,
  },
  {
    levelId: 2,
    title: "Protecting Your Money",
    subtitle: "Money is lost when you can't see what's happening",
    theme: "Detection",
    isAdvancedCohortOnly: false,
  },
  {
    levelId: 3,
    title: "Taking Control of Your Money",
    subtitle: "If you don't control money, it controls you",
    theme: "Control",
    isAdvancedCohortOnly: false,
  },
  {
    levelId: 4,
    title: "Generating Your Own Income",
    subtitle: "Money comes from creating value for others",
    theme: "Creation",
    isAdvancedCohortOnly: false,
  },
  {
    levelId: 5,
    title: "Growing Your Money",
    subtitle: "Money grows when it is put to work",
    theme: "Growth",
    isAdvancedCohortOnly: true,
  },
  {
    levelId: 6,
    title: "Structuring & Optimising Your Money",
    subtitle: "How you structure money determines how much you keep and grow",
    theme: "Optimisation",
    isAdvancedCohortOnly: true,
  },
] as const;

export const SKILLS_REGISTRY: readonly SkillRegistryRecord[] = [
  {
    id: 1,
    levelId: 1,
    skillNumber: 1,
    skillSlug: "stop-and-think",
    skillName: "Catch Impulse Spending",
    description: "Pause before an impulse buy",
    isAdvancedCohortOnly: false,
    legacySlugs: ["cash-stash-basics", "money-mindset"],
    medalEmoji: "🛑",
  },
  {
    id: 2,
    levelId: 1,
    skillNumber: 2,
    skillSlug: "put-needs-first",
    skillName: "Choose Needs Over Wants",
    description: "Put needs ahead of wants",
    isAdvancedCohortOnly: false,
    legacySlugs: ["needs-vs-wants", "giving-mindset"],
    medalEmoji: "⚖️",
  },
  {
    id: 3,
    levelId: 1,
    skillNumber: 3,
    skillSlug: "smart-saving",
    skillName: "Believe Money Can Be Made",
    description: "See that money can be earned",
    isAdvancedCohortOnly: false,
    legacySlugs: ["savings-streak", "keep-some-aside"],
    medalEmoji: "💰",
  },
  {
    id: 4,
    levelId: 2,
    skillNumber: 4,
    skillSlug: "stop-the-leak",
    skillName: "Create Value People Will Pay For",
    description: "Make something others will pay for",
    isAdvancedCohortOnly: false,
    legacySlugs: ["side-hustle-launchpad"],
    medalEmoji: "💧",
  },
  {
    id: 5,
    levelId: 2,
    skillNumber: 5,
    skillSlug: "knowing-debt",
    skillName: "Find & Close Simple Opportunities",
    description: "Find and close simple chances to earn",
    isAdvancedCohortOnly: false,
    legacySlugs: ["credit-debt"],
    medalEmoji: "📋",
  },
  {
    id: 6,
    levelId: 2,
    skillNumber: 6,
    skillSlug: "safe-guarding",
    skillName: "Track What You Earn and Spend",
    description: "Track money in and money out",
    isAdvancedCohortOnly: false,
    legacySlugs: ["scam-defense"],
    medalEmoji: "🛡️",
  },
  {
    id: 7,
    levelId: 3,
    skillNumber: 7,
    skillSlug: "budgeting-basics",
    skillName: "Run a Simple Money System",
    description: "Run a simple system for your money",
    isAdvancedCohortOnly: false,
    legacySlugs: ["vault-setup"],
    medalEmoji: "📊",
  },
  {
    id: 8,
    levelId: 3,
    skillNumber: 8,
    skillSlug: "compound-saving",
    skillName: "Protect a Safety Buffer",
    description: "Protect a safety buffer of cash",
    isAdvancedCohortOnly: false,
    legacySlugs: ["interest-growth"],
    medalEmoji: "📈",
  },
  {
    id: 9,
    levelId: 3,
    skillNumber: 9,
    skillSlug: "building-buffers",
    skillName: "Review Your Numbers",
    description: "Review your numbers regularly",
    isAdvancedCohortOnly: false,
    legacySlugs: ["goal-setting-101"],
    medalEmoji: "🧱",
  },
  {
    id: 10,
    levelId: 4,
    skillNumber: 10,
    skillSlug: "build-value",
    skillName: "Understand Assets vs Liabilities",
    description: "Tell assets from liabilities",
    isAdvancedCohortOnly: false,
    medalEmoji: "💡",
  },
  {
    id: 11,
    levelId: 4,
    skillNumber: 11,
    skillSlug: "making-offers",
    skillName: "Understand Compounding & Starting Young",
    description: "Understand compounding and starting young",
    isAdvancedCohortOnly: false,
    legacySlugs: ["business-pricing"],
    medalEmoji: "📣",
  },
  {
    id: 12,
    levelId: 4,
    skillNumber: 12,
    skillSlug: "closing-deals",
    skillName: "Put Money to Work",
    description: "Put money to work so it can grow",
    isAdvancedCohortOnly: false,
    medalEmoji: "🤝",
  },
  {
    id: 13,
    levelId: 5,
    skillNumber: 13,
    skillSlug: "knowing-assets",
    skillName: "Increase the Value of What You Offer",
    description: "Increase the value of what you offer",
    isAdvancedCohortOnly: true,
    legacySlugs: ["angel-investing-101", "investment-portfolio"],
    medalEmoji: "🏛️",
  },
  {
    id: 14,
    levelId: 5,
    skillNumber: 14,
    skillSlug: "risk-management",
    skillName: "Expand or Improve Income Streams",
    description: "Expand or improve income streams",
    isAdvancedCohortOnly: true,
    medalEmoji: "🎯",
  },
  {
    id: 15,
    levelId: 5,
    skillNumber: 15,
    skillSlug: "strategic-debt",
    skillName: "Manage Basic Downside Risk in Earning",
    description: "Manage basic downside risk in earning",
    isAdvancedCohortOnly: true,
    medalEmoji: "⚡",
  },
  {
    id: 16,
    levelId: 6,
    skillNumber: 16,
    skillSlug: "income-optimization",
    skillName: "Spot Where You Are Still the Bottleneck",
    description: "Spot where you are still the bottleneck",
    isAdvancedCohortOnly: true,
    legacySlugs: ["tax-basics"],
    medalEmoji: "💵",
  },
  {
    id: 17,
    levelId: 6,
    skillNumber: 17,
    skillSlug: "strategic-storage",
    skillName: "Design Ownership Instead of Just Work",
    description: "Design ownership instead of just work",
    isAdvancedCohortOnly: true,
    medalEmoji: "🏦",
  },
  {
    id: 18,
    levelId: 6,
    skillNumber: 18,
    skillSlug: "the-big-picture",
    skillName: "Replace Yourself with a System, Person or Tool",
    description: "Replace yourself with a system, person or tool",
    isAdvancedCohortOnly: true,
    legacySlugs: ["wealth-planning"],
    medalEmoji: "🌍",
  },
] as const;

export const SKILLS_REGISTRY_COUNT = SKILLS_REGISTRY.length;
export const SKILLS_PER_LEVEL = 3;
export const SKILL_LEVEL_COUNT = SKILLS_LEVELS.length;

/** Derive level id from global skill index (1 skill per slot, 3 skills per level). */
export function levelIdForSkillNumber(skillNumber: number): SkillLevelId {
  const clamped = Math.min(18, Math.max(1, Math.floor(skillNumber)));
  return Math.ceil(clamped / SKILLS_PER_LEVEL) as SkillLevelId;
}

export function getSkillLevelDefinition(
  levelId: SkillLevelId,
): SkillLevelDefinition | undefined {
  return SKILLS_LEVELS.find((level) => level.levelId === levelId);
}

/** Resolve any canonical or legacy slug to the registry record. */
export function getSkillRegistryRecord(
  skillKey: string,
): SkillRegistryRecord | undefined {
  return SKILLS_REGISTRY.find(
    (skill) =>
      skill.skillSlug === skillKey ||
      skill.legacySlugs?.includes(skillKey) === true,
  );
}

/** Normalize legacy lesson/vault keys to the canonical registry slug. */
export function resolveCanonicalSkillSlug(skillKey: string): string {
  return getSkillRegistryRecord(skillKey)?.skillSlug ?? skillKey;
}

export function getSkillRegistryRecordByNumber(
  skillNumber: number,
): SkillRegistryRecord | undefined {
  return SKILLS_REGISTRY.find((skill) => skill.skillNumber === skillNumber);
}

export function skillsForLevel(levelId: SkillLevelId): SkillRegistryRecord[] {
  return SKILLS_REGISTRY.filter((skill) => skill.levelId === levelId);
}
