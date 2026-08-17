import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import {
  lessonNumberForMilestoneId,
  levelGroupForMilestoneId,
} from "@/lib/dashboard/academy-state";
import {
  getSkillRegistryRecord,
  getSkillRegistryRecordByNumber,
  resolveCanonicalSkillSlug,
  SKILLS_PER_LEVEL,
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

/** Lessons 1–3 unlock the skill; lessons 4–6 award bronze for the module skill trio. */
export function skillTierForLessonNumber(
  lessonNumber: number,
): Extract<SkillTrophyTier, "unlocked" | "bronze"> | null {
  if (lessonNumber >= 1 && lessonNumber <= 3) return "unlocked";
  if (lessonNumber >= 4 && lessonNumber <= 6) return "bronze";
  return null;
}

/** Map a milestone to the module skill slot unlocked or bronzed (lessons 1–6 only). */
export function resolveSkillSlugForMilestone(milestoneId: number): string | null {
  const lessonNumber = lessonNumberForMilestoneId(milestoneId);
  const tier = skillTierForLessonNumber(lessonNumber);
  if (!tier) return null;

  const levelGroup = levelGroupForMilestoneId(milestoneId);
  const skillSlot = lessonNumber <= 3 ? lessonNumber : lessonNumber - 3;
  const skillNumber = (levelGroup - 1) * SKILLS_PER_LEVEL + skillSlot;
  return getSkillRegistryRecordByNumber(skillNumber)?.skillSlug ?? null;
}

export function setVaultSkillTierOverrideIfHigher(
  skillId: string,
  tier: SkillTrophyTier,
): void {
  const canonicalId = resolveCanonicalSkillSlug(skillId);
  const current = readVaultSkillTierOverrides()[canonicalId] ?? "locked";
  if (TIER_RANK[tier] >= TIER_RANK[current]) return;
  setVaultSkillTierOverride(skillId, tier);
}

/** Apply lesson completion tier progress when cashing in Academy XP. */
export function applyLessonSkillTierProgress(
  milestoneId: number,
  masteryCohort: MasteryCohort,
): void {
  const lessonNumber = lessonNumberForMilestoneId(milestoneId);
  const tier = skillTierForLessonNumber(lessonNumber);
  if (!tier) return;

  const skillSlug = resolveSkillSlugForMilestone(milestoneId);
  if (!skillSlug || !isSkillAccessibleForMasteryCohort(skillSlug, masteryCohort)) {
    return;
  }

  setVaultSkillTierOverrideIfHigher(skillSlug, tier);
}

/** Format the skill unlock line shown on lesson completion screens. */
export function formatLessonSkillUnlockLine(
  skillId: string,
  tier: Extract<SkillTrophyTier, "unlocked" | "bronze">,
): string {
  const registrySkill = getSkillRegistryRecord(skillId);
  const skillName = registrySkill?.skillName ?? getVaultSkillTrophyById(skillId)?.label;

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
