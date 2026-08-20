-- =============================================================================
-- Learner progress (Academy / XP wallet / skills / Vault)
-- Bound to the approved Supabase profile so login can restore saved play
-- on the same device or another device.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.learner_progress (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT learner_progress_payload_object_check
    CHECK (jsonb_typeof(payload) = 'object')
);

COMMENT ON TABLE public.learner_progress IS
  'Saved Academy, XP/wallet, skill trophy, and Vault state for a learner account. Game progress only — not extra PII.';

COMMENT ON COLUMN public.learner_progress.user_id IS
  'Same uuid as profiles.id / auth.users.id.';

COMMENT ON COLUMN public.learner_progress.payload IS
  'JSON blob: academyProgress, wallet, skillProgress, vaultProfile, vaultSession.';

CREATE OR REPLACE FUNCTION public.set_learner_progress_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS learner_progress_set_updated_at ON public.learner_progress;
CREATE TRIGGER learner_progress_set_updated_at
  BEFORE UPDATE ON public.learner_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.set_learner_progress_updated_at();

REVOKE ALL ON TABLE public.learner_progress FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.learner_progress TO authenticated;

ALTER TABLE public.learner_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS learner_progress_select_own ON public.learner_progress;
CREATE POLICY learner_progress_select_own
  ON public.learner_progress
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS learner_progress_insert_own ON public.learner_progress;
CREATE POLICY learner_progress_insert_own
  ON public.learner_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS learner_progress_update_own ON public.learner_progress;
CREATE POLICY learner_progress_update_own
  ON public.learner_progress
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
