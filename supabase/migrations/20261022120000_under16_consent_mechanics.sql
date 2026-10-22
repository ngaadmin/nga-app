-- Under-16 consent follows parent_approval_required, not the learning track.
-- Birth year is not stored. The only age flag is under 16 versus 16 and over.
-- Child profiles cannot opt in to marketing.
--
-- This script does not INSERT, UPDATE, or DELETE any profile, auth user, or
-- consent request. Existing active accounts stay active.
--
-- Pathfinder learners who already signed up under 16 (counted age 14 or 15)
-- are active today with parent_approval_required false or null. They are
-- grandfathered: this script does not move them to pending_consent and does
-- not set parent_approval_required. A later update of those rows still
-- succeeds, because the new trigger only blocks a child who is active, has
-- parent_approval_required true, and has no consent_approved_at.
-- A child who already has marketing_opt_in true keeps it. The trigger blocks
-- turning that flag on, not leaving an existing true value in place.
--
-- Learner accounts still waiting for a parent are deleted after 30 days by
-- the app, once list_account_activity exposes account_status. This script
-- does not delete them. Approved accounts stay on the 12-month inactivity
-- rule. The 24-hour approval link expiry is unchanged.
--
-- Paste this whole file into the Supabase SQL editor. Safe to re-run.
-- Do not apply it from the app.

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
-- Does not rewrite existing rows.
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

-- The retention job needs approval state. Drop is required because the
-- return type changes. Safe to re-run. Does not delete rows by itself.
DROP FUNCTION IF EXISTS public.list_account_activity();

CREATE FUNCTION public.list_account_activity()
RETURNS TABLE (
  id uuid,
  username text,
  account_role text,
  is_teacher boolean,
  teacher_id uuid,
  parent_id uuid,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  last_usage_at timestamptz,
  inactivity_warning_sent_at timestamptz,
  auth_email text,
  guardian_email text,
  teacher_email text,
  parent_email text,
  account_status text,
  consent_approved_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    profiles.id,
    profiles.username::text,
    profiles.account_role,
    profiles.is_teacher,
    profiles.teacher_id,
    parent_child.parent_id,
    profiles.created_at,
    users.last_sign_in_at,
    usage.last_usage_at,
    profiles.inactivity_warning_sent_at,
    users.email::text AS auth_email,
    guardian.guardian_email,
    teacher_user.email::text AS teacher_email,
    parent_user.email::text AS parent_email,
    profiles.account_status,
    profiles.consent_approved_at
  FROM public.profiles AS profiles
  JOIN auth.users AS users ON users.id = profiles.id
  LEFT JOIN public.parent_child AS parent_child
    ON parent_child.child_id = profiles.id
  LEFT JOIN auth.users AS teacher_user
    ON teacher_user.id = profiles.teacher_id
  LEFT JOIN auth.users AS parent_user
    ON parent_user.id = parent_child.parent_id
  LEFT JOIN LATERAL (
    SELECT max(usage_events.created_at) AS last_usage_at
    FROM public.usage_events AS usage_events
    WHERE profiles.username IS NOT NULL
      AND lower(usage_events.username) = lower(profiles.username::text)
  ) AS usage ON true
  LEFT JOIN LATERAL (
    SELECT consent_requests.parent_email::text AS guardian_email
    FROM public.consent_requests AS consent_requests
    WHERE consent_requests.child_id = profiles.id
    ORDER BY consent_requests.created_at DESC
    LIMIT 1
  ) AS guardian ON true;
$$;

COMMENT ON FUNCTION public.list_account_activity() IS
  'Sign-in, activity, notice addresses, and approval state for the retention job. Learner accounts still waiting for a parent to approve them are deleted after 30 days by the app. service_role only.';

REVOKE ALL ON FUNCTION public.list_account_activity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_account_activity() TO service_role;

NOTIFY pgrst, 'reload schema';
