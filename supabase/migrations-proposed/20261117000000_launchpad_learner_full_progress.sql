-- NOT APPLIED. Do not run this against production or the shared preview database.
-- Additive columns so one launchpad_learner_ventures row can restore every
-- answer and the learner's progress on a new device. The Level 1 answer
-- table stays. The only objects replaced are two check constraints, both
-- widened. Existing RLS policies are row-level (user_id = auth.uid()), not
-- column policies, and the grants are table-level SELECT, INSERT, UPDATE.
-- Those already cover columns added here. There are no column grants to extend.
-- Idempotent. Wrapped in a transaction.

begin;

alter table public.launchpad_learner_ventures
  add column if not exists content_hash text,
  add column if not exists completed_task_ids jsonb not null default '[]'::jsonb,
  add column if not exists task_state jsonb not null default '{}'::jsonb,
  add column if not exists answers jsonb not null default '{}'::jsonb,
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
  check (
    jsonb_typeof(completed_task_ids) = 'array'
    and pg_column_size(completed_task_ids) <= 65536
  );

alter table public.launchpad_learner_ventures
  drop constraint if exists launchpad_learner_ventures_task_state_object;

alter table public.launchpad_learner_ventures
  add constraint launchpad_learner_ventures_task_state_object
  check (
    jsonb_typeof(task_state) = 'object'
    and pg_column_size(task_state) <= 65536
  );

alter table public.launchpad_learner_ventures
  drop constraint if exists launchpad_learner_ventures_answers_object;

alter table public.launchpad_learner_ventures
  add constraint launchpad_learner_ventures_answers_object
  check (
    jsonb_typeof(answers) = 'object'
    and pg_column_size(answers) <= 262144
  );

-- Level 1 rows keep their keys. The check grows to allow the fields the app
-- now saves (saving_for, customer_count, achievement) as well as the old ones.
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

-- Table grants, not column grants. Re-asserted so authenticated can read and
-- write the new columns. Row-level policies are unchanged.
grant select, insert, update on table public.launchpad_learner_ventures to authenticated;
grant select, insert, update on table public.launchpad_learner_answers to authenticated;

commit;
