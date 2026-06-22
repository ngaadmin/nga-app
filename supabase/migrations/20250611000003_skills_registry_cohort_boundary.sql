-- Align is_advanced_cohort_only with cohort rules:
-- Skills 1–12 universal (Explorers, Pathfinders, Mavericks).
-- Skills 13–18 Mavericks only (ages 16–18).

UPDATE public.skills_registry
SET is_advanced_cohort_only = (skill_number >= 13);

ALTER TABLE public.skills_registry
  DROP CONSTRAINT IF EXISTS skills_registry_advanced_cohort_boundary_check;

ALTER TABLE public.skills_registry
  ADD CONSTRAINT skills_registry_advanced_cohort_boundary_check
    CHECK (
      (skill_number BETWEEN 1 AND 12 AND is_advanced_cohort_only = FALSE)
      OR (skill_number BETWEEN 13 AND 18 AND is_advanced_cohort_only = TRUE)
    );

COMMENT ON COLUMN public.skills_registry.is_advanced_cohort_only IS
  'FALSE for skills 1–12 (all cohorts). TRUE for skills 13–18 (Mavericks ages 16–18 only).';
