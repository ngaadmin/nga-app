-- Repo copy of the migration already recorded in the database as
-- version 20261104104147 (launchpad_learner_tables). Added 17 Nov 2026 so the
-- repo matches the database before promotion. The text below is the exact
-- recorded statements; it is idempotent. Do not re-apply by hand.

--
-- Launchpad learner tables: one row per learner per venture, plus one row per
-- saved Level 1 answer.
--
-- NOT APPLIED. Prod migrations need Cath's direct yes; previews share the
-- prod database. Nothing in the app reads or writes these tables yet: the
-- learner storage stays in the browser (localStorage) and any later database
-- path must sit behind LAUNCHPAD_LEARNER_DB, off by default.
--
-- Additive only: creates two tables, one helper function, triggers, RLS
-- policies and grants. It does not alter, drop or write to any existing
-- table. Idempotent: every statement is safe to run again.
--
-- Access (mirrors learner_progress, 20260820000000 + 20261015190000):
--   * a signed-in learner reads, adds and updates only their own rows;
--   * adds and updates are blocked while their profile is pending consent;
--   * no one can delete through the API; account deletion removes rows with
--     the service role and by ON DELETE CASCADE from public.profiles;
--   * anon gets nothing. Parents and teachers get no direct read here; the
--     Parent Hub export reads with the service role on the server.
--
-- Answer keys and fields are Cath's (4 Nov, tracker column T). The app-side
-- map from internal keys (l1-offer, ...) will live in one place,
-- lib/launchpad/learner-db/answer-keys.ts (not on this branch yet; held with
-- the app wiring). Plain-English review:
-- migration-review.md (delivered alongside this branch).

-- ---------------------------------------------------------------- helper

-- True when v is a JSON number that is a whole number within lo..hi.
-- CASE keeps the cast from running on non-numbers.
create or replace function public.launchpad_jsonb_whole_in(v jsonb, lo numeric, hi numeric)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case
    when v is null or jsonb_typeof(v) <> 'number' then false
    else (v #>> '{}')::numeric between lo and hi
      and (v #>> '{}')::numeric = trunc((v #>> '{}')::numeric)
  end
$$;

-- True when v is a JSON array of 0+ distinct strings within lo..hi items.
create or replace function public.launchpad_jsonb_id_list(v jsonb, lo integer, hi integer)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case
    when v is null or jsonb_typeof(v) <> 'array' then false
    else jsonb_array_length(v) between lo and hi
      and not exists (select 1 from jsonb_array_elements(v) e where jsonb_typeof(e) <> 'string')
      and (select count(distinct e) from jsonb_array_elements_text(v) e) = jsonb_array_length(v)
  end
$$;

-- True when v is a non-empty JSON string of at most max_len characters.
create or replace function public.launchpad_jsonb_text(v jsonb, max_len integer)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case
    when v is null or jsonb_typeof(v) <> 'string' then false
    else length(btrim(v #>> '{}')) > 0 and length(v #>> '{}') <= max_len
  end
$$;

-- ------------------------------------------------------- learner ventures

create table if not exists public.launchpad_learner_ventures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  venture_id text not null check (venture_id ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  -- The published content version the learner is on (null = bundled build).
  content_version_id uuid references public.launchpad_venture_versions (id) on delete set null,
  current_level smallint not null default 1 check (current_level between 1 and 6),
  current_silver_id text check (current_silver_id is null or current_silver_id ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  onboarding_seen_at timestamptz,
  -- Milestones (Cath, 4 Nov: on this table; jsonb maps chosen):
  --   wrap_up_confirmed_at: {"l1-s1": "2026-11-04T10:00:00Z", ...} per silver
  --   gold_earned_at:       {"1": "2026-11-04T10:05:00Z", ...} per level
  wrap_up_confirmed_at jsonb not null default '{}'::jsonb,
  gold_earned_at jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint launchpad_learner_ventures_user_venture unique (user_id, venture_id),
  constraint launchpad_learner_ventures_id_user unique (id, user_id),
  constraint launchpad_learner_ventures_wrap_up_object
    check (jsonb_typeof(wrap_up_confirmed_at) = 'object' and pg_column_size(wrap_up_confirmed_at) <= 4096),
  constraint launchpad_learner_ventures_gold_object
    check (jsonb_typeof(gold_earned_at) = 'object' and pg_column_size(gold_earned_at) <= 1024)
);

comment on table public.launchpad_learner_ventures is
  'One row per learner per Launchpad venture: where they are and the milestones they reached. No extra PII.';

-- -------------------------------------------------------- learner answers

create table if not exists public.launchpad_learner_answers (
  id uuid primary key default gen_random_uuid(),
  learner_venture_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id text not null check (task_id ~ '^[a-z0-9][a-z0-9-]{0,95}$'),
  bronze_id text not null check (bronze_id ~ '^[a-z0-9][a-z0-9-]{0,95}$'),
  -- Level 1 keys only (there is no Level 2 yet). Tracker rows 5, 12 and 13
  -- save no answer, so they have no key and no row.
  answer_key text not null check (answer_key in (
    'business_offer', 'my_why', 'my_cause',
    'goal_make_money', 'goal_help_others', 'goal_learn_skills',
    'goal_be_my_own_boss', 'goal_support_cause', 'goal_other'
  )),
  -- The answer fields only. Status and draft are separate columns.
  answer jsonb not null default '{}'::jsonb,
  status text not null default 'available' check (status in ('locked', 'available', 'open', 'done')),
  -- Unsaved work on an open task, and the page it was on.
  draft jsonb,
  draft_page smallint check (draft_page is null or draft_page between 0 and 99),
  opened_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- The answer belongs to the same learner as its venture row; deleting the
  -- venture row deletes its answers.
  constraint launchpad_learner_answers_venture_fk
    foreign key (learner_venture_id, user_id)
    references public.launchpad_learner_ventures (id, user_id) on delete cascade,
  -- One row per answer key per learner venture (the goal task has six).
  constraint launchpad_learner_answers_one_per_key unique (learner_venture_id, answer_key),

  constraint launchpad_learner_answers_answer_object
    check (jsonb_typeof(answer) = 'object' and pg_column_size(answer) <= 8192),
  constraint launchpad_learner_answers_draft_object
    check (draft is null or (jsonb_typeof(draft) = 'object' and pg_column_size(draft) <= 16384)),
  constraint launchpad_learner_answers_done_has_time
    check (status <> 'done' or completed_at is not null),

  -- Only the fields each key may hold.
  constraint launchpad_learner_answers_known_fields check (
    case answer_key
      when 'business_offer' then (answer - array['selected_options']) = '{}'::jsonb
      when 'my_why' then (answer - array['ranking', 'not_applicable']) = '{}'::jsonb
      when 'my_cause' then (answer - array['cause_area']) = '{}'::jsonb
      when 'goal_make_money' then (answer - array['amount', 'currency', 'timeframe_number', 'timeframe_unit', 'not_applicable']) = '{}'::jsonb
      when 'goal_help_others' then (answer - array['benefit', 'timeframe_number', 'timeframe_unit', 'not_applicable']) = '{}'::jsonb
      when 'goal_learn_skills' then (answer - array['skill', 'timeframe_number', 'timeframe_unit', 'not_applicable']) = '{}'::jsonb
      -- Required single pick: no duration, no not_applicable (Cath, 8:02pm).
      when 'goal_be_my_own_boss' then (answer - array['top_reason']) = '{}'::jsonb
      -- The cause area is carried from my_cause, never stored again.
      when 'goal_support_cause' then (answer - array['donate_percent', 'not_applicable']) = '{}'::jsonb
      -- No number or money field (Cath, 8:01pm).
      when 'goal_other' then (answer - array['goal_text', 'timeframe_number', 'timeframe_unit']) = '{}'::jsonb
      else false
    end
  ),

  -- Field values, wherever present (any status).
  constraint launchpad_learner_answers_timeframe_number check (
    not (answer ? 'timeframe_number')
    or public.launchpad_jsonb_whole_in(answer -> 'timeframe_number', 1, 99)
  ),
  constraint launchpad_learner_answers_timeframe_unit check (
    not (answer ? 'timeframe_unit')
    or (answer -> 'timeframe_unit') in ('"weeks"'::jsonb, '"months"'::jsonb)
  ),
  constraint launchpad_learner_answers_amount check (
    not (answer ? 'amount')
    or public.launchpad_jsonb_whole_in(answer -> 'amount', 1, 9999999)
  ),
  constraint launchpad_learner_answers_currency check (
    not (answer ? 'currency')
    or (jsonb_typeof(answer -> 'currency') = 'string' and (answer ->> 'currency') ~ '^[A-Z]{3}$')
  ),
  constraint launchpad_learner_answers_donate_percent check (
    not (answer ? 'donate_percent')
    or public.launchpad_jsonb_whole_in(answer -> 'donate_percent', 1, 100)
  ),
  constraint launchpad_learner_answers_not_applicable check (
    not (answer ? 'not_applicable')
    or case answer_key
      when 'my_why' then public.launchpad_jsonb_id_list(answer -> 'not_applicable', 0, 5)
      else jsonb_typeof(answer -> 'not_applicable') = 'boolean'
    end
  ),
  constraint launchpad_learner_answers_selected_options check (
    not (answer ? 'selected_options')
    or public.launchpad_jsonb_id_list(answer -> 'selected_options', 0, 5)
  ),
  constraint launchpad_learner_answers_ranking check (
    not (answer ? 'ranking')
    or public.launchpad_jsonb_id_list(answer -> 'ranking', 0, 5)
  ),
  constraint launchpad_learner_answers_single_picks check (
    (not (answer ? 'cause_area') or jsonb_typeof(answer -> 'cause_area') = 'string')
    and (not (answer ? 'top_reason') or jsonb_typeof(answer -> 'top_reason') = 'string')
  ),
  constraint launchpad_learner_answers_texts check (
    (not (answer ? 'benefit') or public.launchpad_jsonb_text(answer -> 'benefit', 120))
    and (not (answer ? 'skill') or public.launchpad_jsonb_text(answer -> 'skill', 120))
    and (not (answer ? 'goal_text') or public.launchpad_jsonb_text(answer -> 'goal_text', 120))
  ),

  -- What a finished (done) answer must hold.
  constraint launchpad_learner_answers_done_complete check (
    status <> 'done'
    or case answer_key
      -- At least 1 offer, at most 5 (Cath, 7:58pm).
      when 'business_offer' then public.launchpad_jsonb_id_list(answer -> 'selected_options', 1, 5)
      when 'my_why' then public.launchpad_jsonb_id_list(answer -> 'ranking', 5, 5)
      when 'my_cause' then answer ? 'cause_area'
      when 'goal_be_my_own_boss' then answer ? 'top_reason'
      when 'goal_other' then true
      else
        coalesce(answer -> 'not_applicable', 'false'::jsonb) = 'true'::jsonb
        or case answer_key
          when 'goal_make_money' then answer ?& array['amount', 'currency', 'timeframe_number', 'timeframe_unit']
          when 'goal_help_others' then answer ?& array['benefit', 'timeframe_number', 'timeframe_unit']
          when 'goal_learn_skills' then answer ?& array['skill', 'timeframe_number', 'timeframe_unit']
          when 'goal_support_cause' then answer ? 'donate_percent'
          else false
        end
    end
  )
);

comment on table public.launchpad_learner_answers is
  'One row per saved Level 1 Launchpad answer per learner venture. Answer fields only; status and draft are separate columns.';

create index if not exists launchpad_learner_answers_user_id_idx
  on public.launchpad_learner_answers (user_id);
-- (learner_venture_id, answer_key) and (user_id, venture_id) are indexed by
-- their unique constraints.

-- ------------------------------------------------------ updated_at triggers

create or replace function public.set_launchpad_learner_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists launchpad_learner_ventures_set_updated_at on public.launchpad_learner_ventures;
create trigger launchpad_learner_ventures_set_updated_at
  before update on public.launchpad_learner_ventures
  for each row
  execute function public.set_launchpad_learner_updated_at();

drop trigger if exists launchpad_learner_answers_set_updated_at on public.launchpad_learner_answers;
create trigger launchpad_learner_answers_set_updated_at
  before update on public.launchpad_learner_answers
  for each row
  execute function public.set_launchpad_learner_updated_at();

-- -------------------------------------------------------------- grants

revoke all on table public.launchpad_learner_ventures from anon, authenticated;
revoke all on table public.launchpad_learner_answers from anon, authenticated;
grant select, insert, update on table public.launchpad_learner_ventures to authenticated;
grant select, insert, update on table public.launchpad_learner_answers to authenticated;

-- ---------------------------------------------------------------- RLS

alter table public.launchpad_learner_ventures enable row level security;
alter table public.launchpad_learner_answers enable row level security;

drop policy if exists launchpad_learner_ventures_select_own on public.launchpad_learner_ventures;
create policy launchpad_learner_ventures_select_own
  on public.launchpad_learner_ventures
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists launchpad_learner_ventures_insert_own on public.launchpad_learner_ventures;
create policy launchpad_learner_ventures_insert_own
  on public.launchpad_learner_ventures
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where profiles.id = launchpad_learner_ventures.user_id
        and profiles.account_status <> 'pending_consent'
    )
  );

drop policy if exists launchpad_learner_ventures_update_own on public.launchpad_learner_ventures;
create policy launchpad_learner_ventures_update_own
  on public.launchpad_learner_ventures
  for update
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where profiles.id = launchpad_learner_ventures.user_id
        and profiles.account_status <> 'pending_consent'
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where profiles.id = launchpad_learner_ventures.user_id
        and profiles.account_status <> 'pending_consent'
    )
  );

drop policy if exists launchpad_learner_answers_select_own on public.launchpad_learner_answers;
create policy launchpad_learner_answers_select_own
  on public.launchpad_learner_answers
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists launchpad_learner_answers_insert_own on public.launchpad_learner_answers;
create policy launchpad_learner_answers_insert_own
  on public.launchpad_learner_answers
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where profiles.id = launchpad_learner_answers.user_id
        and profiles.account_status <> 'pending_consent'
    )
  );

drop policy if exists launchpad_learner_answers_update_own on public.launchpad_learner_answers;
create policy launchpad_learner_answers_update_own
  on public.launchpad_learner_answers
  for update
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where profiles.id = launchpad_learner_answers.user_id
        and profiles.account_status <> 'pending_consent'
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where profiles.id = launchpad_learner_answers.user_id
        and profiles.account_status <> 'pending_consent'
    )
  );
