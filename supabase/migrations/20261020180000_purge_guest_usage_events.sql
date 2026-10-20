-- Guest activity retention: delete guest usage_events older than 30 days.
-- Paste this whole file into the Supabase SQL editor and run it once.
-- Safe to re-run. The app does not apply migrations by itself.
--
-- A guest row is a usage_events row whose username matches no profile.
-- profiles.username is citext, so the insert lookup treats "River" and "river"
-- as the same account. This delete uses lower() on both sides, which matches
-- that for the usernames the app allows. usage_events has no user id.
-- Real-account rows are not deleted, at any age.
--
-- The privacy cron calls purge_guest_usage_events() with the service role.
-- The created_at index serves that age filter. The existing usage indexes
-- lead with class_id or username, so they do not.

CREATE OR REPLACE FUNCTION public.purge_guest_usage_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  removed integer;
BEGIN
  DELETE FROM public.usage_events
  WHERE created_at < now() - interval '30 days'
    AND NOT EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.username IS NOT NULL
        AND lower(profiles.username::text) = lower(usage_events.username)
    );

  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

COMMENT ON FUNCTION public.purge_guest_usage_events() IS
  'Deletes usage_events older than 30 days when the username matches no profile. Real accounts are kept.';

REVOKE ALL ON FUNCTION public.purge_guest_usage_events() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_guest_usage_events() TO service_role;

GRANT DELETE ON TABLE public.usage_events TO service_role;

CREATE INDEX IF NOT EXISTS usage_events_created_at_idx
  ON public.usage_events (created_at);

NOTIFY pgrst, 'reload schema';
