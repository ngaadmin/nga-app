-- Index for cohort-scoped skills_registry reads (Explorers/Pathfinders filter Maverick-only rows).
CREATE INDEX IF NOT EXISTS skills_registry_advanced_cohort_idx
  ON public.skills_registry (is_advanced_cohort_only);

COMMENT ON INDEX public.skills_registry_advanced_cohort_idx IS
  'Supports is_advanced_cohort_only.eq.false filters for Explorer and Pathfinder skill payloads.';
