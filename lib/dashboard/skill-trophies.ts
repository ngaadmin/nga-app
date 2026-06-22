import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { totalSkillsToMasterForMasteryCohort } from "@/lib/dashboard/mastery-cohort";
import {
  getSkillRegistryRecord,
  resolveCanonicalSkillSlug,
  SKILLS_REGISTRY,
  type SkillRegistryRecord,
} from "@/lib/skills/skills-registry";
import { skillsRegistryForMasteryCohort } from "@/lib/skills/skills-registry-query";
import { readVaultSkillTierOverrides } from "@/lib/dashboard/vault-skill-progress-storage";

export type SkillTrophyTier = "gold" | "silver" | "bronze" | "locked";

export type VaultSkillTrophy = {
  id: string;
  label: string;
  description: string;
  skillNumber: number;
  levelId: number;
  tier: SkillTrophyTier;
  medalEmoji: string;
  /** Skills 13–18 — hidden from Explorers and Pathfinders; Mavericks only. */
  advancedOnly?: boolean;
};

const TIER_RANK: Record<SkillTrophyTier, number> = {
  gold: 0,
  silver: 1,
  bronze: 2,
  locked: 3,
};

function mapRegistryToTrophies(
  registry: readonly SkillRegistryRecord[],
): VaultSkillTrophy[] {
  return registry.map((skill) => ({
    id: skill.skillSlug,
    label: skill.skillName,
    description: skill.description,
    skillNumber: skill.skillNumber,
    levelId: skill.levelId,
    tier: "locked" as const,
    medalEmoji: skill.medalEmoji,
    advancedOnly: skill.isAdvancedCohortOnly,
  }));
}

/** UI scaffold built from the universal 18-skill registry. */
export const VAULT_SKILL_TROPHIES: readonly VaultSkillTrophy[] =
  mapRegistryToTrophies(SKILLS_REGISTRY);

function normalizedTierOverrides(
  overrides: Partial<Record<string, SkillTrophyTier>>,
): Partial<Record<string, SkillTrophyTier>> {
  const normalized: Partial<Record<string, SkillTrophyTier>> = {};

  for (const [key, tier] of Object.entries(overrides)) {
    if (!tier) continue;
    normalized[resolveCanonicalSkillSlug(key)] = tier;
  }

  return normalized;
}

function applyTierOverrides(
  trophies: readonly VaultSkillTrophy[],
  overrides: Partial<Record<string, SkillTrophyTier>>,
): VaultSkillTrophy[] {
  return trophies.map((trophy) => ({
    ...trophy,
    tier: overrides[trophy.id] ?? trophy.tier,
  }));
}

/** Merge persisted Vault skill progress over the static scaffold (all 18 skills). */
export function resolveVaultSkillTrophies(): VaultSkillTrophy[] {
  const overrides = normalizedTierOverrides(readVaultSkillTierOverrides());
  return applyTierOverrides(VAULT_SKILL_TROPHIES, overrides);
}

/** Cohort-scoped trophies — skips skills 13–18 for Explorers and Pathfinders. */
export function resolveVaultSkillTrophiesForCohort(
  masteryCohort: MasteryCohort,
): VaultSkillTrophy[] {
  const overrides = normalizedTierOverrides(readVaultSkillTierOverrides());
  const registry = skillsRegistryForMasteryCohort(masteryCohort);
  return applyTierOverrides(mapRegistryToTrophies(registry), overrides);
}

/** Lookup a skill trophy from the global achievements inventory. */
export function getVaultSkillTrophyById(
  skillId: string,
): VaultSkillTrophy | undefined {
  const canonicalId = resolveCanonicalSkillSlug(skillId);
  return resolveVaultSkillTrophies().find((trophy) => trophy.id === canonicalId);
}

/** Format the bronze unlock line shown on lesson completion screens. */
export function formatLessonBronzeSkillLine(skillId: string): string {
  const registrySkill = getSkillRegistryRecord(skillId);
  if (registrySkill) {
    return `Skill Unlocked: Bronze Medal - ${registrySkill.skillName}`;
  }

  const trophy = getVaultSkillTrophyById(skillId);
  if (!trophy) return "Skill Unlocked: Bronze Medal";
  return `Skill Unlocked: Bronze Medal - ${trophy.label}`;
}

export function sortTrophiesByTier(
  trophies: readonly VaultSkillTrophy[],
): VaultSkillTrophy[] {
  return [...trophies].sort(
    (a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier],
  );
}

export function countEarnedMedals(
  trophies: readonly VaultSkillTrophy[],
  medalTier: Exclude<SkillTrophyTier, "locked">,
): number {
  return trophies.filter((trophy) => trophy.tier === medalTier).length;
}

export function countNotYetStartedSkills(
  cohortSkills: readonly VaultSkillTrophy[],
  masteryCohort: MasteryCohort,
): number {
  const total = totalSkillsToMasterForMasteryCohort(masteryCohort);
  const gold = countEarnedMedals(cohortSkills, "gold");
  const silver = countEarnedMedals(cohortSkills, "silver");
  const bronze = countEarnedMedals(cohortSkills, "bronze");
  return Math.max(0, total - gold - silver - bronze);
}
