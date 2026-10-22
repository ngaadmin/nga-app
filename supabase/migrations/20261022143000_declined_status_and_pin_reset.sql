-- Declined learner status and a single-use parent PIN reset.
-- Does not INSERT, UPDATE, or DELETE any profile, auth user, or consent row.
-- Do not apply this from the app or against production until Cath says so.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('pending_consent', 'active', 'declined'));

COMMENT ON COLUMN public.profiles.account_status IS
  'pending_consent | active | declined. declined means a parent said no. The 30-day unapproved-account job removes it. This script does not delete anyone.';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS parent_pin_reset_hash text,
  ADD COLUMN IF NOT EXISTS parent_pin_reset_expires_at timestamptz;

COMMENT ON COLUMN public.profiles.parent_pin_reset_hash IS
  'SHA-256 of the current parent PIN reset link. Cleared when the link is used. Null means no live link.';

COMMENT ON COLUMN public.profiles.parent_pin_reset_expires_at IS
  'When the current parent PIN reset link stops working. About 30 minutes after it is emailed.';

REVOKE SELECT (parent_pin_reset_hash, parent_pin_reset_expires_at)
  ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE UPDATE (parent_pin_reset_hash, parent_pin_reset_expires_at)
  ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE INSERT (parent_pin_reset_hash, parent_pin_reset_expires_at)
  ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

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
     OR NEW.parent_pin_hash IS DISTINCT FROM OLD.parent_pin_hash
     OR NEW.parent_pin_reset_hash IS DISTINCT FROM OLD.parent_pin_reset_hash
     OR NEW.parent_pin_reset_expires_at IS DISTINCT FROM OLD.parent_pin_reset_expires_at
     OR NEW.inactivity_warning_sent_at IS DISTINCT FROM OLD.inactivity_warning_sent_at
     OR NEW.curriculum_cohort IS DISTINCT FROM OLD.curriculum_cohort
  THEN
    RAISE EXCEPTION 'Cannot change protected profile fields from the client';
  END IF;

  RETURN NEW;
END;
$$;
