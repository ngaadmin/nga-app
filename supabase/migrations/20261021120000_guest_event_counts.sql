-- =============================================================================
-- Counts-only guest analytics, reserved Penny guest names, cron heartbeat.
-- Paste this whole file into the Supabase SQL editor and run it once.
-- Safe to re-run. The app does not apply migrations by itself.
--
-- Assumes public.usage_events and public.profiles already exist.
-- Does not update or delete existing profile rows.
--
-- guest_event_counts is one row per UTC day and dimension, with a count.
-- There is no guest username, no per-event timestamp, and no coins, XP,
-- streak, IP address, or user agent.
--
-- The increment and cron functions that write those tables are SECURITY
-- DEFINER and live in the private schema, which is not exposed to the Data
-- API. Do not add "private" to the API exposed schemas. The public wrappers
-- are SECURITY INVOKER and executable by service_role only.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

-- -----------------------------------------------------------------------------
-- 1. guest_event_counts
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.guest_event_counts (
  day date NOT NULL,
  event_type text NOT NULL,
  lesson_number integer,
  app_version text NOT NULL,
  device_type text NOT NULL,
  country text NOT NULL,
  count integer NOT NULL,

  CONSTRAINT guest_event_counts_event_type_check
    CHECK (
      event_type IN (
        'login',
        'lesson_started',
        'lesson_completed',
        'lesson_abandoned',
        'medal_earned',
        'vault_visit',
        'launchpad_visit'
      )
    ),
  CONSTRAINT guest_event_counts_lesson_number_check
    CHECK (lesson_number IS NULL OR lesson_number BETWEEN 1 AND 999),
  CONSTRAINT guest_event_counts_app_version_check
    CHECK (app_version ~ '^[0-9A-Za-z._+-]{1,32}$'),
  CONSTRAINT guest_event_counts_device_type_check
    CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  CONSTRAINT guest_event_counts_country_check
    CHECK (country ~ '^[A-Z]{2}$'),
  CONSTRAINT guest_event_counts_count_check
    CHECK (count >= 1 AND count <= 2147483647)
);

-- Nullable lesson_number must still share one bucket. UNIQUE NULLS NOT DISTINCT
-- treats null as equal, which a plain UNIQUE constraint does not.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'guest_event_counts_dimensions_key'
      AND conrelid = 'public.guest_event_counts'::regclass
  ) THEN
    ALTER TABLE public.guest_event_counts
      ADD CONSTRAINT guest_event_counts_dimensions_key
      UNIQUE NULLS NOT DISTINCT (
        day,
        event_type,
        lesson_number,
        app_version,
        device_type,
        country
      );
  END IF;
END $$;

COMMENT ON TABLE public.guest_event_counts IS
  'Daily guest activity counts. No username, timestamp, IP, user agent, coins, XP, or streak.';

COMMENT ON COLUMN public.guest_event_counts.day IS
  'UTC calendar day of the count. Not a per-event timestamp.';

COMMENT ON COLUMN public.guest_event_counts.country IS
  'Coarse country code taken from the edge header, or ZZ when it is missing. Not an IP address.';

COMMENT ON COLUMN public.guest_event_counts.device_type IS
  'Coarse class: mobile, tablet, or desktop. Not the user agent.';

COMMENT ON COLUMN public.guest_event_counts.count IS
  'How many guest events fell in this day and dimension bucket.';

REVOKE ALL ON TABLE public.guest_event_counts FROM PUBLIC, anon, authenticated, service_role;

ALTER TABLE public.guest_event_counts ENABLE ROW LEVEL SECURITY;

-- No policies. anon and authenticated cannot read or write.
-- The SQL editor (superuser) can read. Writes go through the private function.

-- -----------------------------------------------------------------------------
-- 2. Atomic increment. Service role calls the public wrapper only.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.increment_guest_event_count(
  p_day date,
  p_event_type text,
  p_lesson_number integer,
  p_app_version text,
  p_device_type text,
  p_country text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lesson integer;
BEGIN
  IF p_day IS NULL
     OR p_event_type IS NULL
     OR p_event_type NOT IN (
       'login',
       'lesson_started',
       'lesson_completed',
       'lesson_abandoned',
       'medal_earned',
       'vault_visit',
       'launchpad_visit'
     )
     OR p_app_version IS NULL
     OR p_app_version !~ '^[0-9A-Za-z._+-]{1,32}$'
     OR p_device_type IS NULL
     OR p_device_type NOT IN ('mobile', 'tablet', 'desktop')
     OR p_country IS NULL
     OR p_country !~ '^[A-Z]{2}$'
     OR (
       p_lesson_number IS NOT NULL
       AND (p_lesson_number < 1 OR p_lesson_number > 999)
     )
  THEN
    RAISE EXCEPTION 'invalid guest count' USING ERRCODE = '22023';
  END IF;

  lesson := p_lesson_number;
  IF p_event_type NOT IN (
    'lesson_started',
    'lesson_completed',
    'lesson_abandoned',
    'medal_earned'
  ) THEN
    lesson := NULL;
  END IF;

  INSERT INTO public.guest_event_counts (
    day,
    event_type,
    lesson_number,
    app_version,
    device_type,
    country,
    count
  ) VALUES (
    p_day,
    p_event_type,
    lesson,
    p_app_version,
    p_device_type,
    p_country,
    1
  )
  ON CONFLICT ON CONSTRAINT guest_event_counts_dimensions_key
  DO UPDATE SET count = LEAST(public.guest_event_counts.count + 1, 2147483647);
END;
$$;

COMMENT ON FUNCTION private.increment_guest_event_count(date, text, integer, text, text, text) IS
  'Adds one to the matching guest count bucket. Does not store a username, IP, or user agent.';

REVOKE ALL ON FUNCTION private.increment_guest_event_count(date, text, integer, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.increment_guest_event_count(date, text, integer, text, text, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.increment_guest_event_count(
  p_day date,
  p_event_type text,
  p_lesson_number integer,
  p_app_version text,
  p_device_type text,
  p_country text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  PERFORM private.increment_guest_event_count(
    p_day,
    p_event_type,
    p_lesson_number,
    p_app_version,
    p_device_type,
    p_country
  );
END;
$$;

COMMENT ON FUNCTION public.increment_guest_event_count(date, text, integer, text, text, text) IS
  'Service-role entry point for private.increment_guest_event_count. Not for browser roles.';

REVOKE ALL ON FUNCTION public.increment_guest_event_count(date, text, integer, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_guest_event_count(date, text, integer, text, text, text)
  TO service_role;

-- -----------------------------------------------------------------------------
-- 3. Signed-in usage_events may record a lesson that was left unfinished.
-- -----------------------------------------------------------------------------

ALTER TABLE public.usage_events DROP CONSTRAINT IF EXISTS usage_events_event_type_check;

ALTER TABLE public.usage_events
  ADD CONSTRAINT usage_events_event_type_check
  CHECK (
    event_type IN (
      'login',
      'lesson_started',
      'lesson_completed',
      'lesson_abandoned',
      'medal_earned',
      'vault_visit',
      'launchpad_visit'
    )
  );

-- -----------------------------------------------------------------------------
-- 4. Real usernames cannot take a guest Penny#### or PennyX#### handle.
--    Existing rows are not modified. A profile that already has one of these
--    names can keep it; a new insert, or a change onto the pattern, cannot.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reject_reserved_guest_username()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.username IS NOT NULL
     AND btrim(NEW.username::text) ~* '^pennyx?[0-9]{4}$'
     AND (
       TG_OP = 'INSERT'
       OR OLD.username IS NULL
       OR lower(btrim(OLD.username::text)) IS DISTINCT FROM lower(btrim(NEW.username::text))
     )
  THEN
    RAISE EXCEPTION 'username is reserved' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.reject_reserved_guest_username() IS
  'Blocks new Penny#### and PennyX#### usernames. Does not rewrite existing profiles.';

-- Profile writers must be able to fire this trigger. It only accepts or rejects
-- the row; it does not read guest counts or cron history.
REVOKE ALL ON FUNCTION public.reject_reserved_guest_username() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_reserved_guest_username() TO anon, authenticated, service_role;

DROP TRIGGER IF EXISTS profiles_reject_reserved_guest_username ON public.profiles;
CREATE TRIGGER profiles_reject_reserved_guest_username
  BEFORE INSERT OR UPDATE OF username
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_reserved_guest_username();

-- -----------------------------------------------------------------------------
-- 5. cron_runs — one row per privacy-retention run, counts only, 60 days.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cron_runs (
  id bigserial PRIMARY KEY,
  job text NOT NULL,
  ran_at timestamptz NOT NULL DEFAULT now(),
  ok boolean NOT NULL,
  detail jsonb NOT NULL,

  CONSTRAINT cron_runs_job_check
    CHECK (job ~ '^[a-z0-9-]{1,64}$')
);

COMMENT ON TABLE public.cron_runs IS
  'Cron heartbeats. detail is counts only. Read from the SQL editor. No client access.';

COMMENT ON COLUMN public.cron_runs.detail IS
  'Numeric counts only. No usernames, emails, IP addresses, or user agents.';

REVOKE ALL ON TABLE public.cron_runs FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON SEQUENCE public.cron_runs_id_seq FROM PUBLIC, anon, authenticated, service_role;

ALTER TABLE public.cron_runs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS cron_runs_ran_at_idx
  ON public.cron_runs (ran_at);

CREATE OR REPLACE FUNCTION public.cron_runs_detail_counts_only()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  entry record;
  keys integer := 0;
BEGIN
  IF NEW.detail IS NULL OR jsonb_typeof(NEW.detail) <> 'object' THEN
    RAISE EXCEPTION 'cron detail must be counts only' USING ERRCODE = '22023';
  END IF;

  FOR entry IN SELECT * FROM jsonb_each(NEW.detail)
  LOOP
    keys := keys + 1;
    IF keys > 20
       OR entry.key !~ '^[A-Za-z][A-Za-z0-9]{0,40}$'
       OR jsonb_typeof(entry.value) <> 'number'
    THEN
      RAISE EXCEPTION 'cron detail must be counts only' USING ERRCODE = '22023';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.cron_runs_detail_counts_only() IS
  'Rejects a cron_runs detail value that is not an object of numbers.';

REVOKE ALL ON FUNCTION public.cron_runs_detail_counts_only() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS cron_runs_detail_counts_only ON public.cron_runs;
CREATE TRIGGER cron_runs_detail_counts_only
  BEFORE INSERT OR UPDATE OF detail
  ON public.cron_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.cron_runs_detail_counts_only();

CREATE OR REPLACE FUNCTION private.record_cron_run(
  p_job text,
  p_ok boolean,
  p_detail jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_job IS NULL OR p_job !~ '^[a-z0-9-]{1,64}$' OR p_ok IS NULL THEN
    RAISE EXCEPTION 'invalid cron run' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.cron_runs (job, ok, detail)
  VALUES (p_job, p_ok, COALESCE(p_detail, '{}'::jsonb));

  DELETE FROM public.cron_runs
  WHERE ran_at < now() - interval '60 days';
END;
$$;

COMMENT ON FUNCTION private.record_cron_run(text, boolean, jsonb) IS
  'Inserts one cron heartbeat and deletes cron_runs older than 60 days.';

REVOKE ALL ON FUNCTION private.record_cron_run(text, boolean, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.record_cron_run(text, boolean, jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION public.record_cron_run(
  p_job text,
  p_ok boolean,
  p_detail jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  PERFORM private.record_cron_run(p_job, p_ok, p_detail);
END;
$$;

COMMENT ON FUNCTION public.record_cron_run(text, boolean, jsonb) IS
  'Service-role entry point for private.record_cron_run. Not for browser roles.';

REVOKE ALL ON FUNCTION public.record_cron_run(text, boolean, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_cron_run(text, boolean, jsonb)
  TO service_role;

NOTIFY pgrst, 'reload schema';
