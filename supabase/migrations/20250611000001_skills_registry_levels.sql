-- Migrate skills_registry from deprecated module phase column to level_id hierarchy.
-- Safe for databases that applied an earlier draft of 20250611000000_skills_registry.sql.

ALTER TABLE public.skills_registry
  ADD COLUMN IF NOT EXISTS level_id SMALLINT,
  ADD COLUMN IF NOT EXISTS is_advanced_cohort_only BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'skills_registry'
      AND column_name = 'module'
  ) THEN
    UPDATE public.skills_registry
    SET
      level_id = CASE
        WHEN skill_number BETWEEN 1 AND 3 THEN 1
        WHEN skill_number BETWEEN 4 AND 6 THEN 2
        WHEN skill_number BETWEEN 7 AND 9 THEN 3
        WHEN skill_number BETWEEN 10 AND 12 THEN 4
        WHEN skill_number BETWEEN 13 AND 15 THEN 5
        WHEN skill_number BETWEEN 16 AND 18 THEN 6
        ELSE CEIL(skill_number / 3.0)::SMALLINT
      END,
      is_advanced_cohort_only = (skill_number >= 13)
    WHERE level_id IS NULL;

    ALTER TABLE public.skills_registry DROP COLUMN IF EXISTS module;
    DROP INDEX IF EXISTS skills_registry_module_idx;
  END IF;
END $$;

UPDATE public.skills_registry
SET
  level_id = CEIL(skill_number / 3.0)::SMALLINT,
  is_advanced_cohort_only = (skill_number >= 13)
WHERE level_id IS NULL;

ALTER TABLE public.skills_registry
  ALTER COLUMN level_id SET NOT NULL;

ALTER TABLE public.skills_registry
  DROP CONSTRAINT IF EXISTS skills_registry_module_check,
  DROP CONSTRAINT IF EXISTS skills_registry_level_id_check,
  DROP CONSTRAINT IF EXISTS skills_registry_level_skill_alignment_check;

ALTER TABLE public.skills_registry
  ADD CONSTRAINT skills_registry_level_id_check
    CHECK (level_id >= 1 AND level_id <= 6),
  ADD CONSTRAINT skills_registry_level_skill_alignment_check
    CHECK (level_id = CEIL(skill_number / 3.0));

CREATE INDEX IF NOT EXISTS skills_registry_level_id_idx
  ON public.skills_registry (level_id);

INSERT INTO public.skills_registry (
  level_id,
  skill_number,
  skill_slug,
  skill_name,
  description,
  is_advanced_cohort_only
) VALUES
  (1, 1, 'stop-and-think', 'Stop & Think', 'Recognise and Pause Impulsive Spending', FALSE),
  (1, 2, 'put-needs-first', 'Put Needs First', 'Consider Consequences Before Choosing', FALSE),
  (1, 3, 'smart-saving', 'Smart Saving', 'Choose to Keep Some Money Instead of Spending It All', FALSE),
  (2, 4, 'stop-the-leak', 'Stop the Leak', 'Identify Hidden Spending (Invisible Money)', FALSE),
  (2, 5, 'knowing-debt', 'Knowing Debt', 'Evaluate Debt & Future Cost (BNPL)', FALSE),
  (2, 6, 'safe-guarding', 'Safe Guarding', 'Detect and Avoid Financial Scams', FALSE),
  (3, 7, 'budgeting-basics', 'Budgeting Basics', 'Track Money Using a Cashflow System', FALSE),
  (3, 8, 'compound-saving', 'Compound Saving', 'Building a Savings Engine', FALSE),
  (3, 9, 'building-buffers', 'Building Buffers', 'Build Financial Stability (Emergency Buffer)', FALSE),
  (4, 10, 'build-value', 'Build Value', 'Identify Opportunities to Create Value', FALSE),
  (4, 11, 'making-offers', 'Making Offers', 'Design Clear and Compelling Offers', FALSE),
  (4, 12, 'closing-deals', 'Closing Deals', 'Build Trust and Close Simple Sales', FALSE),
  (5, 13, 'knowing-assets', 'Knowing Assets', 'Choose Assets to Grow Money', TRUE),
  (5, 14, 'risk-management', 'Risk Management', 'Manage Risk Through Diversification', TRUE),
  (5, 15, 'strategic-debt', 'Strategic Debt', 'Use Debt Strategically to Support Growth', TRUE),
  (6, 16, 'income-optimization', 'Income Optimization', 'Keeping more of what you make', TRUE),
  (6, 17, 'strategic-storage', 'Strategic Storage', 'Select Effective Structures for Holding Money', TRUE),
  (6, 18, 'the-big-picture', 'The Big Picture', 'Use Long-Term Systems to Maximise Wealth', TRUE)
ON CONFLICT (skill_number) DO UPDATE SET
  level_id = EXCLUDED.level_id,
  skill_slug = EXCLUDED.skill_slug,
  skill_name = EXCLUDED.skill_name,
  description = EXCLUDED.description,
  is_advanced_cohort_only = EXCLUDED.is_advanced_cohort_only;
