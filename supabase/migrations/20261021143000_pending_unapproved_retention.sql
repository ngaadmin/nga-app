-- Learner accounts still waiting for a parent to approve them are deleted
-- after 30 days by the privacy retention job. This replaces
-- list_account_activity so that job can see account_status and
-- consent_approved_at. The 12-month inactivity rule for other accounts is
-- unchanged. The 24-hour approval link expiry is unchanged.
--
-- Safe to re-run. Does not delete rows by itself.

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
