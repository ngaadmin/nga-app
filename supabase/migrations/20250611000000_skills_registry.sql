-- NGA Universal Skills Registry: 6 Levels × 3 Skills (18 total)
-- Maps to lib/skills/skills-registry.ts (application seed source of truth)

CREATE TABLE IF NOT EXISTS public.skills_registry (
  id SERIAL PRIMARY KEY,
  level_id SMALLINT NOT NULL,
  skill_number INTEGER NOT NULL,
  skill_slug VARCHAR(80) NOT NULL,
  skill_name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  is_advanced_cohort_only BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT skills_registry_skill_number_check
    CHECK (skill_number >= 1 AND skill_number <= 18),
  CONSTRAINT skills_registry_level_id_check
    CHECK (level_id >= 1 AND level_id <= 6),
  CONSTRAINT skills_registry_level_skill_alignment_check
    CHECK (level_id = CEIL(skill_number / 3.0)),
  CONSTRAINT skills_registry_skill_number_unique UNIQUE (skill_number),
  CONSTRAINT skills_registry_skill_slug_unique UNIQUE (skill_slug),
  CONSTRAINT skills_registry_skill_name_unique UNIQUE (skill_name)
);

CREATE INDEX IF NOT EXISTS skills_registry_level_id_idx
  ON public.skills_registry (level_id);

COMMENT ON TABLE public.skills_registry IS
  'Universal 18-skill library organised by 6 progression levels (3 skills each).';

COMMENT ON COLUMN public.skills_registry.level_id IS
  'Core progression level (1-6). Level N contains skill numbers ((N-1)*3+1) through (N*3).';

COMMENT ON COLUMN public.skills_registry.skill_number IS
  'Global mastery index (1-18) across all levels.';

COMMENT ON COLUMN public.skills_registry.is_advanced_cohort_only IS
  'When true, skill is restricted to Mavericks (ages 16–18). Skills 13–18 only.';

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

ALTER TABLE public.skills_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS skills_registry_read_all ON public.skills_registry;
CREATE POLICY skills_registry_read_all
  ON public.skills_registry
  FOR SELECT
  TO authenticated, anon
  USING (true);
