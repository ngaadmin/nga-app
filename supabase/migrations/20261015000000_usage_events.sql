-- =============================================================================
-- School-trial usage events.
-- Anonymous activity only: existing usernames and class ids.
-- No emails, names, IP addresses, or user agents.
-- Safe to paste into the Supabase SQL editor and safe to re-run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.usage_events (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  username text NOT NULL,
  class_id text,
  event_type text NOT NULL,
  lesson_number integer,
  xp_total integer,
  streak_days integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT usage_events_event_type_check
    CHECK (
      event_type IN (
        'login',
        'lesson_started',
        'lesson_completed',
        'medal_earned',
        'vault_visit',
        'launchpad_visit'
      )
    ),
  CONSTRAINT usage_events_username_check
    CHECK (
      char_length(username) BETWEEN 1 AND 80
      AND position('@' IN username) = 0
      AND username !~ '[[:space:]]'
    ),
  CONSTRAINT usage_events_class_id_check
    CHECK (
      class_id IS NULL
      OR (
        char_length(class_id) BETWEEN 1 AND 80
        AND position('@' IN class_id) = 0
        AND class_id !~ '[[:space:]]'
      )
    ),
  CONSTRAINT usage_events_metadata_check
    CHECK (
      jsonb_typeof(metadata) = 'object'
      AND (metadata - 'skill' - 'tier') = '{}'::jsonb
      AND (
        NOT (metadata ? 'skill')
        OR (
          jsonb_typeof(metadata -> 'skill') = 'string'
          AND (metadata ->> 'skill') ~ '^[A-Za-z0-9_-]{1,64}$'
        )
      )
      AND (
        NOT (metadata ? 'tier')
        OR (metadata ->> 'tier') IN ('unlocked', 'bronze', 'silver', 'gold')
      )
    )
);

COMMENT ON TABLE public.usage_events IS
  'School-trial activity. Usernames and class ids only — no emails, names, IPs, or user agents.';

COMMENT ON COLUMN public.usage_events.username IS
  'Existing learner username. Not an email address.';

COMMENT ON COLUMN public.usage_events.class_id IS
  'Existing class id (profiles.teacher_id for a class seat). Null outside a class.';

COMMENT ON COLUMN public.usage_events.metadata IS
  'Optional medal context (skill, tier). Must stay free of personal information.';

CREATE INDEX IF NOT EXISTS usage_events_class_id_created_at_idx
  ON public.usage_events (class_id, created_at);

CREATE INDEX IF NOT EXISTS usage_events_username_created_at_idx
  ON public.usage_events (username, created_at);

-- Default privileges on hosted Supabase can grant this table to anon.
-- Strip that, then allow authenticated inserts only.
REVOKE ALL ON TABLE public.usage_events FROM PUBLIC, anon, authenticated;
GRANT INSERT ON TABLE public.usage_events TO authenticated;
GRANT SELECT, INSERT ON TABLE public.usage_events TO service_role;

REVOKE ALL ON SEQUENCE public.usage_events_id_seq FROM PUBLIC, anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.usage_events_id_seq TO authenticated, service_role;

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- Authenticated learners may insert a row for their own username.
-- There is no SELECT policy: clients cannot read the log.
-- service_role bypasses RLS and is the read path (SQL editor / export).
DROP POLICY IF EXISTS usage_events_insert_own ON public.usage_events;
CREATE POLICY usage_events_insert_own
  ON public.usage_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    username = (
      SELECT p.username::text
      FROM public.profiles AS p
      WHERE p.id = auth.uid()
    )
  );

-- Weekday Monday–Friday, local time Australia/Brisbane, from 08:30 up to
-- but not including 15:00. 15:00 is the end of the school window.
CREATE OR REPLACE VIEW public.usage_events_report
WITH (security_invoker = true) AS
SELECT
  usage_events.id,
  usage_events.created_at,
  usage_events.username,
  usage_events.class_id,
  usage_events.event_type,
  usage_events.lesson_number,
  usage_events.xp_total,
  usage_events.streak_days,
  usage_events.metadata,
  (
    EXTRACT(ISODOW FROM (usage_events.created_at AT TIME ZONE 'Australia/Brisbane'))
      BETWEEN 1 AND 5
    AND (usage_events.created_at AT TIME ZONE 'Australia/Brisbane')::time >= TIME '08:30'
    AND (usage_events.created_at AT TIME ZONE 'Australia/Brisbane')::time < TIME '15:00'
  ) AS in_school_hours
FROM public.usage_events;

COMMENT ON VIEW public.usage_events_report IS
  'usage_events plus in_school_hours. security_invoker so client roles cannot bypass RLS. Read with the service role.';

COMMENT ON COLUMN public.usage_events_report.in_school_hours IS
  'True on Monday–Friday when Australia/Brisbane local time is from 08:30 until 15:00.';

REVOKE ALL ON TABLE public.usage_events_report FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.usage_events_report TO service_role;
