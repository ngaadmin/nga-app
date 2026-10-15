-- Learning track is profiles.curriculum_cohort. Birth year is not collected.
-- Backfill a track from the old placeholder year only when no track was saved,
-- then drop the column. An explicit curriculum_cohort is left as-is.

UPDATE public.profiles
SET curriculum_cohort = CASE
  WHEN (EXTRACT(YEAR FROM CURRENT_DATE)::integer - birth_year - 1) <= 12 THEN 'explorer'
  WHEN (EXTRACT(YEAR FROM CURRENT_DATE)::integer - birth_year - 1) <= 15 THEN 'pathfinder'
  ELSE 'maverick'
END
WHERE account_role = 'child'
  AND curriculum_cohort IS NULL
  AND birth_year IS NOT NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_birth_year_check;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS birth_year;

COMMENT ON TABLE public.profiles IS
  'App profile per auth user. Learning track is curriculum_cohort. Do not store a birth year.';

COMMENT ON COLUMN public.profiles.curriculum_cohort IS
  'Chosen learning track. Explorer is the under-13 consent path.';
