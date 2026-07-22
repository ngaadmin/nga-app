import {
  maxSkillNumberForMasteryCohort,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import {
  SKILLS_REGISTRY,
  type SkillRegistryRecord,
} from "@/lib/skills/skills-registry";

export const SKILLS_REGISTRY_TABLE = "skills_registry" as const;

/** Columns fetched for UI trophy/skill lists — omit server-only fields when added. */
export const SKILLS_REGISTRY_SELECT_COLUMNS =
  "id,level_id,skill_number,skill_slug,skill_name,description,is_advanced_cohort_only" as const;

/**
 * PostgREST filter fragment for cohort-scoped reads.
 * Explorers: skills 1–12 · Pathfinders: 1–15 · Mavericks: full registry.
 */
export function skillsRegistryPostgrestFilter(
  masteryCohort: MasteryCohort,
): string {
  const maxSkill = maxSkillNumberForMasteryCohort(masteryCohort);
  return `skill_number.lte.${maxSkill}&order=skill_number.asc`;
}

/** In-memory registry slice — mirrors the Supabase cohort filter until the client is wired. */
export function skillsRegistryForMasteryCohort(
  masteryCohort: MasteryCohort,
): readonly SkillRegistryRecord[] {
  const maxSkill = maxSkillNumberForMasteryCohort(masteryCohort);
  return SKILLS_REGISTRY.filter((skill) => skill.skillNumber <= maxSkill);
}

export function isSkillAccessibleForMasteryCohort(
  skillKey: string,
  masteryCohort: MasteryCohort,
): boolean {
  const record = SKILLS_REGISTRY.find(
    (skill) =>
      skill.skillSlug === skillKey ||
      skill.legacySlugs?.includes(skillKey) === true,
  );
  if (!record) return false;
  return record.skillNumber <= maxSkillNumberForMasteryCohort(masteryCohort);
}
