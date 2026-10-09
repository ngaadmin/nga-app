-- Teacher class cohort: every seat created for this teacher uses this track.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS class_cohort text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_class_cohort_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_class_cohort_check
  CHECK (
    class_cohort IS NULL
    OR class_cohort IN ('explorer', 'pathfinder', 'maverick')
  );

COMMENT ON COLUMN public.profiles.class_cohort IS
  'Curriculum track for this teacher''s class seats. Set on /dashboard/class before students are created.';

CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NULL OR (auth.jwt() ->> 'role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.account_role IS DISTINCT FROM OLD.account_role
     OR NEW.account_status IS DISTINCT FROM OLD.account_status
     OR NEW.consent_approved_at IS DISTINCT FROM OLD.consent_approved_at
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.is_teacher IS DISTINCT FROM OLD.is_teacher
     OR NEW.seat_cap IS DISTINCT FROM OLD.seat_cap
     OR NEW.class_password IS DISTINCT FROM OLD.class_password
     OR NEW.class_cohort IS DISTINCT FROM OLD.class_cohort
     OR NEW.teacher_id IS DISTINCT FROM OLD.teacher_id
  THEN
    RAISE EXCEPTION 'Cannot change protected profile fields from the client';
  END IF;

  RETURN NEW;
END;
$$;
