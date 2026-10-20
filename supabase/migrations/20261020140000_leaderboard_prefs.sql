-- Leaderboard switches and the short history parents and teachers see.
-- Run after 20261020120000_privacy_retention.sql.
-- A missing leaderboard_prefs row means off. Clients cannot write either table.

CREATE TABLE IF NOT EXISTS public.leaderboard_prefs (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.leaderboard_prefs IS
  'One row per child, or per teacher for that class. Missing row means the leaderboard is off.';

COMMENT ON COLUMN public.leaderboard_prefs.profile_id IS
  'Child profile id for a home account, or the teacher profile id for a class.';

COMMENT ON COLUMN public.leaderboard_prefs.enabled IS
  'When true, that child or class can see the Community leaderboard.';

CREATE TABLE IF NOT EXISTS public.account_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  detail text NOT NULL DEFAULT '',
  CONSTRAINT account_history_title_len CHECK (char_length(title) BETWEEN 1 AND 120),
  CONSTRAINT account_history_detail_len CHECK (char_length(detail) <= 240)
);

CREATE INDEX IF NOT EXISTS account_history_profile_occurred_idx
  ON public.account_history (profile_id, occurred_at DESC);

COMMENT ON TABLE public.account_history IS
  'Short parent or teacher record, such as a leaderboard switch. Not a full audit log.';

ALTER TABLE public.leaderboard_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leaderboard_prefs_select_own ON public.leaderboard_prefs;
CREATE POLICY leaderboard_prefs_select_own
  ON public.leaderboard_prefs
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS leaderboard_prefs_select_linked_child ON public.leaderboard_prefs;
CREATE POLICY leaderboard_prefs_select_linked_child
  ON public.leaderboard_prefs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.parent_child
      WHERE parent_child.parent_id = auth.uid()
        AND parent_child.child_id = leaderboard_prefs.profile_id
    )
  );

DROP POLICY IF EXISTS leaderboard_prefs_select_class ON public.leaderboard_prefs;
CREATE POLICY leaderboard_prefs_select_class
  ON public.leaderboard_prefs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS seat
      WHERE seat.id = auth.uid()
        AND seat.teacher_id = leaderboard_prefs.profile_id
    )
  );

DROP POLICY IF EXISTS account_history_select_own ON public.account_history;
CREATE POLICY account_history_select_own
  ON public.account_history
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS account_history_select_linked_child ON public.account_history;
CREATE POLICY account_history_select_linked_child
  ON public.account_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.parent_child
      WHERE parent_child.parent_id = auth.uid()
        AND parent_child.child_id = account_history.profile_id
    )
  );

REVOKE ALL ON TABLE public.leaderboard_prefs FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.account_history FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.leaderboard_prefs TO authenticated;
GRANT SELECT ON TABLE public.account_history TO authenticated;

-- Writes stay on the service role, which bypasses RLS after the app checks the caller.
