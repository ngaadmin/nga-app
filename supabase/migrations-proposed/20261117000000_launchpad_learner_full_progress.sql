-- NOT APPLIED. Do not run this against production or the shared preview database.
-- The live save writes only columns that already exist on
-- launchpad_learner_ventures and launchpad_learner_answers
-- (migration 20261104104147). Those tables cannot hold the venture flow:
--   * current_level stops at 6, and the building has a 7th floor
--   * there is no column for the completed task list, open-task drafts, or the rooftop finish
--   * content_hash has no column (content_version_id is a uuid only)
--   * answer_key allows nine Level 1 keys, and goal_make_money, goal_help_others,
--     and goal_learn_skills cannot store the fields the app now saves
--     (savingFor, customerCount, achievement)
-- Until this file is applied, those values stay in the browser. The merge
-- keeps them. Nothing here is executed by the app.

alter table public.launchpad_learner_ventures
  add column if not exists content_hash text,
  add column if not exists completed_task_ids jsonb not null default '[]'::jsonb,
  add column if not exists task_state jsonb not null default '{}'::jsonb,
  add column if not exists rooftop_completed_at timestamptz;

alter table public.launchpad_learner_ventures
  drop constraint if exists launchpad_learner_ventures_current_level_check;

alter table public.launchpad_learner_ventures
  add constraint launchpad_learner_ventures_current_level_check
  check (current_level between 1 and 7);

alter table public.launchpad_learner_ventures
  drop constraint if exists launchpad_learner_ventures_completed_tasks_array;

alter table public.launchpad_learner_ventures
  add constraint launchpad_learner_ventures_completed_tasks_array
  check (jsonb_typeof(completed_task_ids) = 'array' and pg_column_size(completed_task_ids) <= 16384);

alter table public.launchpad_learner_ventures
  drop constraint if exists launchpad_learner_ventures_task_state_object;

alter table public.launchpad_learner_ventures
  add constraint launchpad_learner_ventures_task_state_object
  check (jsonb_typeof(task_state) = 'object' and pg_column_size(task_state) <= 65536);

-- Allow the Level 1 fields the app saves today, without dropping the old ones.
alter table public.launchpad_learner_answers
  drop constraint if exists launchpad_learner_answers_known_fields;

alter table public.launchpad_learner_answers
  add constraint launchpad_learner_answers_known_fields check (
    case answer_key
      when 'business_offer' then (answer - array['selected_options']) = '{}'::jsonb
      when 'my_why' then (answer - array['ranking', 'not_applicable']) = '{}'::jsonb
      when 'my_cause' then (answer - array['cause_area']) = '{}'::jsonb
      when 'goal_make_money' then (answer - array['amount', 'currency', 'timeframe_number', 'timeframe_unit', 'not_applicable', 'saving_for']) = '{}'::jsonb
      when 'goal_help_others' then (answer - array['benefit', 'timeframe_number', 'timeframe_unit', 'not_applicable', 'customer_count']) = '{}'::jsonb
      when 'goal_learn_skills' then (answer - array['skill', 'timeframe_number', 'timeframe_unit', 'not_applicable', 'achievement']) = '{}'::jsonb
      when 'goal_be_my_own_boss' then (answer - array['top_reason']) = '{}'::jsonb
      when 'goal_support_cause' then (answer - array['donate_percent', 'not_applicable']) = '{}'::jsonb
      when 'goal_other' then (answer - array['goal_text', 'timeframe_number', 'timeframe_unit']) = '{}'::jsonb
      else false
    end
  );
