-- Teacher class seats: flag, cap, shared class password, seat → teacher link.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_teacher boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS seat_cap integer NOT NULL DEFAULT 30;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS class_password text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_role_check
  CHECK (account_role IN ('child', 'parent_master', 'teacher'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_seat_cap_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_seat_cap_check
  CHECK (seat_cap >= 1 AND seat_cap <= 500);

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_teacher_not_own_seat_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_teacher_not_own_seat_check
  CHECK (teacher_id IS NULL OR teacher_id <> id);

COMMENT ON COLUMN public.profiles.is_teacher IS
  'True only for /school teacher accounts. Class seats stay false.';

COMMENT ON COLUMN public.profiles.seat_cap IS
  'Max class seats this teacher may create. Default 30.';

COMMENT ON COLUMN public.profiles.class_password IS
  'Shared classroom login for this teacher''s seats. Shown on /dashboard/class.';

COMMENT ON COLUMN public.profiles.teacher_id IS
  'Owning teacher for a class seat. Null for teachers and household learners.';

CREATE INDEX IF NOT EXISTS profiles_teacher_id_idx
  ON public.profiles (teacher_id);

CREATE INDEX IF NOT EXISTS profiles_is_teacher_idx
  ON public.profiles (is_teacher)
  WHERE is_teacher;

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
     OR NEW.teacher_id IS DISTINCT FROM OLD.teacher_id
  THEN
    RAISE EXCEPTION 'Cannot change protected profile fields from the client';
  END IF;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS profiles_select_class_seats ON public.profiles;
CREATE POLICY profiles_select_class_seats
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());
