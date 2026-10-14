-- Backfill lifetime XP on wallets saved before that field existed.
-- totalPoints is the live balance and can fall when a learner cashes in.
-- lifetimePointsEarned is the leaderboard total and must never sit below it.
-- Ledger rows are not invented here: a synthetic earn would be counted again
-- the next time this device records a real award.

UPDATE public.learner_progress
SET payload = jsonb_set(
  payload,
  '{wallet,lifetimePointsEarned}',
  to_jsonb(
    GREATEST(
      CASE
        WHEN (payload #>> '{wallet,lifetimePointsEarned}') ~ '^-?[0-9]+(\.[0-9]+)?$'
        THEN trunc((payload #>> '{wallet,lifetimePointsEarned}')::numeric)
        ELSE 0
      END,
      CASE
        WHEN (payload #>> '{wallet,totalPoints}') ~ '^-?[0-9]+(\.[0-9]+)?$'
        THEN trunc((payload #>> '{wallet,totalPoints}')::numeric)
        ELSE 0
      END
    )
  ),
  true
)
WHERE jsonb_typeof(payload -> 'wallet') = 'object'
  AND (
    NOT (payload -> 'wallet' ? 'lifetimePointsEarned')
    OR (payload #>> '{wallet,lifetimePointsEarned}') IS NULL
    OR (
      (payload #>> '{wallet,lifetimePointsEarned}') ~ '^-?[0-9]+(\.[0-9]+)?$'
      AND (payload #>> '{wallet,totalPoints}') ~ '^-?[0-9]+(\.[0-9]+)?$'
      AND trunc((payload #>> '{wallet,lifetimePointsEarned}')::numeric)
        < trunc((payload #>> '{wallet,totalPoints}')::numeric)
    )
  );
