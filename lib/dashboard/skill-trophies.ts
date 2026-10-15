import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import {
  lessonNumberForMilestoneId,
  levelGroupForMilestoneId,
} from "@/lib/dashboard/academy-state";
import {
  lessonSkillAwards,
  skillNumberForMilestoneId,
  skillTierForLessonNumber,
} from "@/lib/skills/lesson-skill-award";
import {
  getSkillRegistryRecord,
  getSkillRegistryRecordByNumber,
  resolveCanonicalSkillSlug,
  SKILLS_REGISTRY,
  type SkillRegistryRecord,
} from "@/lib/skills/skills-registry";
import {
  isSkillAccessibleForMasteryCohort,
  skillsRegistryForMasteryCohort,
} from "@/lib/skills/skills-registry-query";
import {
  readVaultSkillTierOverrides,
  setVaultSkillTierOverride,
} from "@/lib/dashboard/vault-skill-progress-storage";

export type SkillTrophyTier =
  | "gold"
  | "silver"
  | "bronze"
  | "unlocked"
  | "locked";

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
  unlocked: 3,
  locked: 4,
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

/** Cohort-scoped trophies — Explorers 12 · Pathfinders 15 · Mavericks 18. */
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

export { skillTierForLessonNumber };

/** Map a milestone to the module skill slot revealed or bronzed (lessons 1–6 only). */
export function resolveSkillSlugForMilestone(milestoneId: number): string | null {
  const skillNumber = skillNumberForMilestoneId(milestoneId);
  if (!skillNumber) return null;
  return getSkillRegistryRecordByNumber(skillNumber)?.skillSlug ?? null;
}

export type EarnedSkillMedal = {
  slug: string;
  tier: Exclude<SkillTrophyTier, "locked">;
};

export function setVaultSkillTierOverrideIfHigher(
  skillId: string,
  tier: SkillTrophyTier,
): boolean {
  const canonicalId = resolveCanonicalSkillSlug(skillId);
  const current = readVaultSkillTierOverrides()[canonicalId] ?? "locked";
  if (TIER_RANK[tier] >= TIER_RANK[current]) return false;
  setVaultSkillTierOverride(skillId, tier);
  return true;
}

/** Apply lesson completion tier progress when cashing in Academy XP. */
export function applyLessonSkillTierProgress(
  milestoneId: number,
  masteryCohort: MasteryCohort,
): EarnedSkillMedal[] {
  const earned: EarnedSkillMedal[] = [];
  const awards = lessonSkillAwards(
    levelGroupForMilestoneId(milestoneId),
    lessonNumberForMilestoneId(milestoneId),
  );
  for (const award of awards) {
    if (!isSkillAccessibleForMasteryCohort(award.slug, masteryCohort)) continue;
    if (!setVaultSkillTierOverrideIfHigher(award.slug, award.tier)) continue;
    earned.push({ slug: award.slug, tier: award.tier });
  }
  return earned;
}

/**
 * Write the medal tier from a payload completion row.
 * Lesson-number rules (lessons 1–3 unlocked, 4–6 bronze) do not apply.
 */
export function applyPayloadSkillTierProgress(
  skillSlug: string,
  tier: Exclude<SkillTrophyTier, "locked">,
  masteryCohort: MasteryCohort,
): EarnedSkillMedal[] {
  const canonical = skillSlug.trim();
  if (!canonical) return [];
  if (!isSkillAccessibleForMasteryCohort(canonical, masteryCohort)) return [];
  if (!setVaultSkillTierOverrideIfHigher(canonical, tier)) return [];
  return [{ slug: canonical, tier }];
}

/** Format the skill unlock line shown on lesson completion screens. */
export function formatLessonSkillUnlockLine(
  skillId: string,
  tier: Extract<SkillTrophyTier, "unlocked" | "bronze" | "silver" | "gold">,
  skillNameOverride?: string,
): string {
  const registrySkill = getSkillRegistryRecord(skillId);
  const skillName =
    skillNameOverride?.trim() ||
    registrySkill?.skillName ||
    getVaultSkillTrophyById(skillId)?.label;

  if (tier === "gold") {
    return skillName ? `Gold medal - ${skillName}` : "Gold medal";
  }
  if (tier === "silver") {
    return skillName ? `Silver medal - ${skillName}` : "Silver medal";
  }
  if (tier === "bronze") {
    return skillName
      ? `Skill Unlocked: Bronze Medal - ${skillName}`
      : "Skill Unlocked: Bronze Medal";
  }

  return skillName ? `Skill Unlocked - ${skillName}` : "Skill Unlocked";
}

/** @deprecated Use formatLessonSkillUnlockLine(skillId, "bronze"). */
export function formatLessonBronzeSkillLine(skillId: string): string {
  return formatLessonSkillUnlockLine(skillId, "bronze");
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
  medalTier: Exclude<SkillTrophyTier, "locked" | "unlocked">,
): number {
  return trophies.filter((trophy) => trophy.tier === medalTier).length;
}

export function countUnlockedSkills(
  trophies: readonly VaultSkillTrophy[],
): number {
  return trophies.filter((trophy) => trophy.tier === "unlocked").length;
}

export function countNotYetStartedSkills(
  cohortSkills: readonly VaultSkillTrophy[],
): number {
  return cohortSkills.filter((skill) => skill.tier === "locked").length;
}

export type GroupedSkillTrophies = {
  earned: VaultSkillTrophy[];
  unlocked: VaultSkillTrophy[];
  locked: VaultSkillTrophy[];
};

/** Skills cabinet groups: Earned (bronze+) → Unlocked → Locked. */
export function groupSkillsByProgress(
  skills: readonly VaultSkillTrophy[],
): GroupedSkillTrophies {
  const earned: VaultSkillTrophy[] = [];
  const unlocked: VaultSkillTrophy[] = [];
  const locked: VaultSkillTrophy[] = [];

  for (const skill of skills) {
    if (skill.tier === "locked") {
      locked.push(skill);
    } else if (skill.tier === "unlocked") {
      unlocked.push(skill);
    } else {
      earned.push(skill);
    }
  }

  earned.sort(
    (a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || a.skillNumber - b.skillNumber,
  );
  unlocked.sort((a, b) => a.skillNumber - b.skillNumber);
  locked.sort((a, b) => a.skillNumber - b.skillNumber);

  return { earned, unlocked, locked };
}
