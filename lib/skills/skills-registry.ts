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
    skillName: "Stop & Think",
    description: "Recognise and Pause Impulsive Spending",
    isAdvancedCohortOnly: false,
    legacySlugs: ["cash-stash-basics", "money-mindset"],
    medalEmoji: "🛑",
  },
  {
    id: 2,
    levelId: 1,
    skillNumber: 2,
    skillSlug: "put-needs-first",
    skillName: "Put Needs First",
    description: "Consider Consequences Before Choosing",
    isAdvancedCohortOnly: false,
    legacySlugs: ["needs-vs-wants", "giving-mindset"],
    medalEmoji: "⚖️",
  },
  {
    id: 3,
    levelId: 1,
    skillNumber: 3,
    skillSlug: "smart-saving",
    skillName: "Smart Saving",
    description: "Choose to Keep Some Money Instead of Spending It All",
    isAdvancedCohortOnly: false,
    legacySlugs: ["savings-streak", "keep-some-aside"],
    medalEmoji: "💰",
  },
  {
    id: 4,
    levelId: 2,
    skillNumber: 4,
    skillSlug: "stop-the-leak",
    skillName: "Stop the Leak",
    description: "Identify Hidden Spending (Invisible Money)",
    isAdvancedCohortOnly: false,
    legacySlugs: ["side-hustle-launchpad"],
    medalEmoji: "💧",
  },
  {
    id: 5,
    levelId: 2,
    skillNumber: 5,
    skillSlug: "knowing-debt",
    skillName: "Knowing Debt",
    description: "Evaluate Debt & Future Cost (BNPL)",
    isAdvancedCohortOnly: false,
    legacySlugs: ["credit-debt"],
    medalEmoji: "📋",
  },
  {
    id: 6,
    levelId: 2,
    skillNumber: 6,
    skillSlug: "safe-guarding",
    skillName: "Safe Guarding",
    description: "Detect and Avoid Financial Scams",
    isAdvancedCohortOnly: false,
    legacySlugs: ["scam-defense"],
    medalEmoji: "🛡️",
  },
  {
    id: 7,
    levelId: 3,
    skillNumber: 7,
    skillSlug: "budgeting-basics",
    skillName: "Budgeting Basics",
    description: "Track Money Using a Cashflow System",
    isAdvancedCohortOnly: false,
    legacySlugs: ["vault-setup"],
    medalEmoji: "📊",
  },
  {
    id: 8,
    levelId: 3,
    skillNumber: 8,
    skillSlug: "compound-saving",
    skillName: "Compound Saving",
    description: "Building a Savings Engine",
    isAdvancedCohortOnly: false,
    legacySlugs: ["interest-growth"],
    medalEmoji: "📈",
  },
  {
    id: 9,
    levelId: 3,
    skillNumber: 9,
    skillSlug: "building-buffers",
    skillName: "Building Buffers",
    description: "Build Financial Stability (Emergency Buffer)",
    isAdvancedCohortOnly: false,
    legacySlugs: ["goal-setting-101"],
    medalEmoji: "🧱",
  },
  {
    id: 10,
    levelId: 4,
    skillNumber: 10,
    skillSlug: "build-value",
    skillName: "Build Value",
    description: "Identify Opportunities to Create Value",
    isAdvancedCohortOnly: false,
    medalEmoji: "💡",
  },
  {
    id: 11,
    levelId: 4,
    skillNumber: 11,
    skillSlug: "making-offers",
    skillName: "Making Offers",
    description: "Design Clear and Compelling Offers",
    isAdvancedCohortOnly: false,
    legacySlugs: ["business-pricing"],
    medalEmoji: "📣",
  },
  {
    id: 12,
    levelId: 4,
    skillNumber: 12,
    skillSlug: "closing-deals",
    skillName: "Closing Deals",
    description: "Build Trust and Close Simple Sales",
    isAdvancedCohortOnly: false,
    medalEmoji: "🤝",
  },
  {
    id: 13,
    levelId: 5,
    skillNumber: 13,
    skillSlug: "knowing-assets",
    skillName: "Knowing Assets",
    description: "Choose Assets to Grow Money",
    isAdvancedCohortOnly: true,
    legacySlugs: ["angel-investing-101", "investment-portfolio"],
    medalEmoji: "🏛️",
  },
  {
    id: 14,
    levelId: 5,
    skillNumber: 14,
    skillSlug: "risk-management",
    skillName: "Risk Management",
    description: "Manage Risk Through Diversification",
    isAdvancedCohortOnly: true,
    medalEmoji: "🎯",
  },
  {
    id: 15,
    levelId: 5,
    skillNumber: 15,
    skillSlug: "strategic-debt",
    skillName: "Strategic Debt",
    description: "Use Debt Strategically to Support Growth",
    isAdvancedCohortOnly: true,
    medalEmoji: "⚡",
  },
  {
    id: 16,
    levelId: 6,
    skillNumber: 16,
    skillSlug: "income-optimization",
    skillName: "Income Optimization",
    description: "Keeping more of what you make",
    isAdvancedCohortOnly: true,
    legacySlugs: ["tax-basics"],
    medalEmoji: "💵",
  },
  {
    id: 17,
    levelId: 6,
    skillNumber: 17,
    skillSlug: "strategic-storage",
    skillName: "Strategic Storage",
    description: "Select Effective Structures for Holding Money",
    isAdvancedCohortOnly: true,
    medalEmoji: "🏦",
  },
  {
    id: 18,
    levelId: 6,
    skillNumber: 18,
    skillSlug: "the-big-picture",
    skillName: "The Big Picture",
    description: "Use Long-Term Systems to Maximise Wealth",
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
