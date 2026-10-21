-- Under-16 consent follows parent_approval_required, not the learning track.
-- Birth year is not stored. The only age flag is under 16 versus 16 and over,
-- so a child profile cannot opt in to marketing (that would include 16-17).
-- Parent accounts are unchanged.
--
-- Paste this whole file into the Supabase SQL editor and run it once.
-- Do not apply it from the app. Do not run it against production from a script.
-- Safe to re-run.

COMMENT ON COLUMN public.profiles.parent_approval_required IS
  'True when learner self sign-up is under 16 and parent approval is required. False when the check is 16 or over. Null when no self sign-up age check ran (teachers, class seats, parent-added profiles, older rows). Birth year is not stored.';

COMMENT ON COLUMN public.profiles.age_checked_at IS
  'When learner self sign-up ran the age check. Null when that check did not run.';

COMMENT ON COLUMN public.profiles.curriculum_cohort IS
  'Chosen learning track. Parent approval is parent_approval_required, not this column.';

COMMENT ON COLUMN public.profiles.marketing_opt_in IS
  'Parent accounts may opt in. Child profiles cannot turn this on, because the stored age flag cannot separate 16-17 from 18+.';

-- Clients must not retarget their own track. Service role still can
-- (parent track changes and signup). Latest protected-column list, plus track.
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
     OR NEW.inactivity_warning_sent_at IS DISTINCT FROM OLD.inactivity_warning_sent_at
     OR NEW.curriculum_cohort IS DISTINCT FROM OLD.curriculum_cohort
  THEN
    RAISE EXCEPTION 'Cannot change protected profile fields from the client';
  END IF;

  RETURN NEW;
END;
$$;

-- Applies to service role as well as browser clients.
CREATE OR REPLACE FUNCTION public.enforce_learner_signup_rules()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.account_role = 'child'
     AND NEW.parent_approval_required IS TRUE
     AND NEW.account_status = 'active'
     AND NEW.consent_approved_at IS NULL
  THEN
    RAISE EXCEPTION 'Under-16 learner profiles stay pending until a parent approves';
  END IF;

  IF NEW.account_role = 'child'
     AND NEW.marketing_opt_in IS TRUE
     AND (TG_OP = 'INSERT' OR OLD.marketing_opt_in IS DISTINCT FROM TRUE)
  THEN
    RAISE EXCEPTION 'Learner profiles cannot opt in to marketing';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_enforce_learner_signup_rules ON public.profiles;
CREATE TRIGGER profiles_enforce_learner_signup_rules
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_learner_signup_rules();

-- Approval links are written by the server. A signed-in child must not mint one.
DROP POLICY IF EXISTS consent_requests_insert_own_child ON public.consent_requests;
REVOKE INSERT ON TABLE public.consent_requests FROM anon, authenticated;

NOTIFY pgrst, 'reload schema';
