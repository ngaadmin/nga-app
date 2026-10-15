-- Learner sign-up age check. Stores the result only.
-- Do not add a birth year column. Do not apply this file from the app.
-- Paste it into the Supabase SQL editor.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS parent_approval_required boolean,
  ADD COLUMN IF NOT EXISTS age_checked_at timestamptz;

COMMENT ON COLUMN public.profiles.parent_approval_required IS
  'True when the learner age check requires parent approval (13 or under). Birth year is not stored.';

COMMENT ON COLUMN public.profiles.age_checked_at IS
  'When learner sign-up ran the age check. Null for guests, teachers, class seats, and parent-added profiles.';

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
     OR NEW.class_password_enc IS DISTINCT FROM OLD.class_password_enc
     OR NEW.class_cohort IS DISTINCT FROM OLD.class_cohort
     OR NEW.teacher_id IS DISTINCT FROM OLD.teacher_id
     OR NEW.parent_approval_required IS DISTINCT FROM OLD.parent_approval_required
     OR NEW.age_checked_at IS DISTINCT FROM OLD.age_checked_at
  THEN
    RAISE EXCEPTION 'Cannot change protected profile fields from the client';
  END IF;

  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
