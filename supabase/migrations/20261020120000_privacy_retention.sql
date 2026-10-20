-- Privacy retention: activity-log deletion, inactivity warnings, 30-day sign-in log.
-- Paste this whole file into the Supabase SQL editor and run it once.
-- Safe to re-run. The app does not apply migrations by itself.
--
-- Run this before the app version that deletes accounts, or account deletion
-- stops until this function exists (we refuse to free a username while its
-- activity rows might still be there).
--
-- pg_cron is available on the Free plan, but a paused Free project does not
-- run it and it cannot wake itself. This file only adds the SQL the app calls.
-- A daily Vercel cron wakes the database and calls these functions.

-- -----------------------------------------------------------------------------
-- 1. Delete usage_events for one username, ignoring letter case.
--    Usernames can be registered again after deletion. Events are matched with
--    lower() so "River" and "river" do not leave the previous student's rows
--    behind. Blank values and email addresses delete nothing.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.delete_usage_events_for_username(target_username text)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  removed integer;
  normalized text;
BEGIN
  normalized := lower(btrim(coalesce(target_username, '')));
  IF normalized = '' OR position('@' in normalized) > 0 THEN
    RETURN 0;
  END IF;

  DELETE FROM public.usage_events
  WHERE lower(username) = normalized;

  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

COMMENT ON FUNCTION public.delete_usage_events_for_username(text) IS
  'Deletes activity rows for a username, case-insensitively. Call before the profile username is freed.';

REVOKE ALL ON FUNCTION public.delete_usage_events_for_username(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_usage_events_for_username(text) TO service_role;

GRANT DELETE ON TABLE public.usage_events TO service_role;

CREATE INDEX IF NOT EXISTS usage_events_lower_username_idx
  ON public.usage_events (lower(username));

-- -----------------------------------------------------------------------------
-- 2. One inactivity warning per quiet period. Cleared when the account is used again.
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS inactivity_warning_sent_at timestamptz;

COMMENT ON COLUMN public.profiles.inactivity_warning_sent_at IS
  'When we emailed that this account will be deleted for inactivity. Null after the account is active again.';

-- Keep the latest protected-column list and add the privacy columns.
-- Clients must not clear the warning or overwrite the parent PIN hash.
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
  THEN
    RAISE EXCEPTION 'Cannot change protected profile fields from the client';
  END IF;

  RETURN NEW;
END;
$$;

-- A 4-digit PIN can be guessed from its hash. Hide the hash from browser roles.
REVOKE SELECT (parent_pin_hash) ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE UPDATE (parent_pin_hash) ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE INSERT (parent_pin_hash) ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

REVOKE UPDATE (inactivity_warning_sent_at) ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE INSERT (inactivity_warning_sent_at) ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Sign-in audit log (includes IP addresses). Kept 30 days.
--    security definer is required because auth.audit_log_entries is not exposed
--    to the Data API. Execute is limited to service_role. The function stays in
--    public so the app can call it with the service role key.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.purge_auth_audit_log()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  removed integer;
BEGIN
  DELETE FROM auth.audit_log_entries
  WHERE created_at < now() - interval '30 days';

  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

COMMENT ON FUNCTION public.purge_auth_audit_log() IS
  'Deletes sign-in audit rows older than 30 days, including stored IP addresses.';

REVOKE ALL ON FUNCTION public.purge_auth_audit_log() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_auth_audit_log() TO service_role;

-- -----------------------------------------------------------------------------
-- 4. Activity snapshot for the daily inactivity job.
--    Returns auth emails so the server can choose a parent or teacher inbox.
--    The app must not email a student address.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.list_account_activity()
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
  parent_email text
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
    parent_user.email::text AS parent_email
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
  'Sign-in, activity, and notice addresses for the inactivity job. service_role only.';

REVOKE ALL ON FUNCTION public.list_account_activity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_account_activity() TO service_role;

NOTIFY pgrst, 'reload schema';
