-- Owner decision 21 Oct 2026: definitive 18 skill names.
-- Slugs stay stable so saved medals and progress keep their ids.
-- Module 5 (skills 13-15) is Pathfinder and Maverick.
-- Module 6 (skills 16-18) is Maverick only (17+).

ALTER TABLE public.skills_registry
  DROP CONSTRAINT IF EXISTS skills_registry_advanced_cohort_boundary_check;

UPDATE public.skills_registry AS s
SET
  skill_name = v.skill_name,
  description = v.description,
  is_advanced_cohort_only = v.is_advanced_cohort_only
FROM (
  VALUES
    (1, 'Catch Impulse Spending', 'Pause before an impulse buy', FALSE),
    (2, 'Choose Needs Over Wants', 'Put needs ahead of wants', FALSE),
    (3, 'Don''t Spend Money You Don''t Have', 'See that money can be earned', FALSE),
    (4, 'Create Value People Will Pay For', 'Make something others will pay for', FALSE),
    (5, 'Find & Close Simple Opportunities', 'Find and close simple chances to earn', FALSE),
    (6, 'Track What You Earn and Spend', 'Track money in and money out', FALSE),
    (7, 'Run a Simple Money System', 'Run a simple system for your money', FALSE),
    (8, 'Protect a Safety Buffer', 'Protect a safety buffer of cash', FALSE),
    (9, 'Review Your Numbers', 'Review your numbers regularly', FALSE),
    (10, 'Understand Assets vs Liabilities', 'Tell assets from liabilities', FALSE),
    (11, 'Understand Compounding & Starting Young', 'Understand compounding and starting young', FALSE),
    (12, 'Put Money to Work', 'Put money to work so it can grow', FALSE),
    (13, 'Increase the Value of What You Offer', 'Increase the value of what you offer', FALSE),
    (14, 'Expand or Improve Income Streams', 'Expand or improve income streams', FALSE),
    (15, 'Manage Basic Downside Risk in Earning', 'Manage basic downside risk in earning', FALSE),
    (16, 'Spot Where You Are Still the Bottleneck', 'Spot where you are still the bottleneck', TRUE),
    (17, 'Design Ownership Instead of Just Work', 'Design ownership instead of just work', TRUE),
    (18, 'Replace Yourself with a System, Person or Tool', 'Replace yourself with a system, person or tool', TRUE)
) AS v(skill_number, skill_name, description, is_advanced_cohort_only)
WHERE s.skill_number = v.skill_number;

ALTER TABLE public.skills_registry
  ADD CONSTRAINT skills_registry_advanced_cohort_boundary_check
    CHECK (
      (skill_number BETWEEN 1 AND 15 AND is_advanced_cohort_only = FALSE)
      OR (skill_number BETWEEN 16 AND 18 AND is_advanced_cohort_only = TRUE)
    );

COMMENT ON COLUMN public.skills_registry.is_advanced_cohort_only IS
  'FALSE for skills 1-15 (Explorer through Pathfinder; Module 5 is Pathfinder and Maverick). TRUE for skills 16-18 (Maverick 17+ only).';
