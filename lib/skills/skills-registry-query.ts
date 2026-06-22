import {
  canAccessAdvancedSkills,
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
 * Explorers and Pathfinders fetch skills 1–12 only; Mavericks fetch the full registry.
 */
export function skillsRegistryPostgrestFilter(
  masteryCohort: MasteryCohort,
): string {
  if (canAccessAdvancedSkills(masteryCohort)) {
    return "order=skill_number.asc";
  }
  return "is_advanced_cohort_only.eq.false&order=skill_number.asc";
}

/** In-memory registry slice — mirrors the Supabase cohort filter until the client is wired. */
export function skillsRegistryForMasteryCohort(
  masteryCohort: MasteryCohort,
): readonly SkillRegistryRecord[] {
  if (canAccessAdvancedSkills(masteryCohort)) {
    return SKILLS_REGISTRY;
  }
  return SKILLS_REGISTRY.filter((skill) => !skill.isAdvancedCohortOnly);
}
