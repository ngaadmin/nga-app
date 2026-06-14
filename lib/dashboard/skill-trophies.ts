import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { totalSkillsToMasterForMasteryCohort } from "@/lib/dashboard/mastery-cohort";

export type SkillTrophyTier = "gold" | "silver" | "bronze" | "locked";

export type VaultSkillTrophy = {
  id: string;
  label: string;
  tier: SkillTrophyTier;
  medalEmoji: string;
  /** Hidden from Younger cohort (<15); Advanced cohort (15+) can earn this skill. */
  advancedOnly?: boolean;
};

const TIER_RANK: Record<SkillTrophyTier, number> = {
  gold: 0,
  silver: 1,
  bronze: 2,
  locked: 3,
};

/** Full skills inventory - 12 base skills + 6 Advanced-only skills (18 total). */
export const VAULT_SKILL_TROPHIES: readonly VaultSkillTrophy[] = [
  {
    id: "vault-setup",
    label: "The Vault Setup",
    tier: "gold",
    medalEmoji: "🏦",
  },
  {
    id: "budgeting-basics",
    label: "Budgeting Basics",
    tier: "silver",
    medalEmoji: "📊",
  },
  {
    id: "smart-saving",
    label: "Smart Saving",
    tier: "silver",
    medalEmoji: "💰",
  },
  {
    id: "giving-mindset",
    label: "The Giving Mindset",
    tier: "bronze",
    medalEmoji: "🎁",
  },
  {
    id: "cash-stash-basics",
    label: "Cash Stash Basics",
    tier: "locked",
    medalEmoji: "🪙",
  },
  {
    id: "needs-vs-wants",
    label: "Needs vs Wants",
    tier: "locked",
    medalEmoji: "⚖️",
  },
  {
    id: "side-hustle-launchpad",
    label: "Side-Hustle Launchpad",
    tier: "locked",
    medalEmoji: "🚀",
  },
  {
    id: "goal-setting-101",
    label: "Goal Setting 101",
    tier: "locked",
    medalEmoji: "🎯",
  },
  {
    id: "interest-growth",
    label: "Interest & Growth",
    tier: "locked",
    medalEmoji: "📈",
  },
  {
    id: "scam-defense",
    label: "Scam Defense",
    tier: "locked",
    medalEmoji: "🛡️",
  },
  {
    id: "savings-streak",
    label: "Savings Streak Builder",
    tier: "locked",
    medalEmoji: "🔥",
  },
  {
    id: "money-mindset",
    label: "Money Mindset",
    tier: "locked",
    medalEmoji: "🧠",
  },
  {
    id: "angel-investing-101",
    label: "Angel Investing 101",
    tier: "locked",
    medalEmoji: "💎",
    advancedOnly: true,
  },
  {
    id: "tax-basics",
    label: "Tax Basics",
    tier: "locked",
    medalEmoji: "🧾",
    advancedOnly: true,
  },
  {
    id: "credit-debt",
    label: "Credit & Debt",
    tier: "locked",
    medalEmoji: "💳",
    advancedOnly: true,
  },
  {
    id: "business-pricing",
    label: "Business Pricing",
    tier: "locked",
    medalEmoji: "🏷️",
    advancedOnly: true,
  },
  {
    id: "investment-portfolio",
    label: "Investment Portfolio",
    tier: "locked",
    medalEmoji: "📊",
    advancedOnly: true,
  },
  {
    id: "wealth-planning",
    label: "Wealth Planning",
    tier: "locked",
    medalEmoji: "🗺️",
    advancedOnly: true,
  },
];

export function sortTrophiesByTier(
  trophies: readonly VaultSkillTrophy[],
): VaultSkillTrophy[] {
  return [...trophies].sort(
    (a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier],
  );
}

/** Skills visible for the user's mastery cohort. */
export function skillTrophiesForMasteryCohort(
  trophies: readonly VaultSkillTrophy[],
  masteryCohort: MasteryCohort,
): VaultSkillTrophy[] {
  return trophies.filter(
    (trophy) => !trophy.advancedOnly || masteryCohort === "advanced",
  );
}

export function countEarnedMedals(
  trophies: readonly VaultSkillTrophy[],
  medalTier: Exclude<SkillTrophyTier, "locked">,
): number {
  return trophies.filter((trophy) => trophy.tier === medalTier).length;
}

export function countNotYetStartedSkills(
  trophies: readonly VaultSkillTrophy[],
  masteryCohort: MasteryCohort,
): number {
  const total = totalSkillsToMasterForMasteryCohort(masteryCohort);
  const cohortSkills = skillTrophiesForMasteryCohort(trophies, masteryCohort);
  const gold = countEarnedMedals(cohortSkills, "gold");
  const silver = countEarnedMedals(cohortSkills, "silver");
  const bronze = countEarnedMedals(cohortSkills, "bronze");
  return Math.max(0, total - gold - silver - bronze);
}
