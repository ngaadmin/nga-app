-- Block learner_progress INSERT and UPDATE while the owner's profile is
-- still pending consent. SELECT stays limited to the signed-in user.
-- Service-role writes bypass RLS. The app also skips those writes until
-- the parent approves. Run this in the Supabase SQL editor.

DROP POLICY IF EXISTS learner_progress_insert_own ON public.learner_progress;
CREATE POLICY learner_progress_insert_own
  ON public.learner_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = learner_progress.user_id
        AND profiles.account_status <> 'pending_consent'
    )
  );

DROP POLICY IF EXISTS learner_progress_update_own ON public.learner_progress;
CREATE POLICY learner_progress_update_own
  ON public.learner_progress
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = learner_progress.user_id
        AND profiles.account_status <> 'pending_consent'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = learner_progress.user_id
        AND profiles.account_status <> 'pending_consent'
    )
  );
