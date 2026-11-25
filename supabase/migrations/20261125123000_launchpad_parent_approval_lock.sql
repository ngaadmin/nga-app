-- Launchpad Level 4 self-approve lock (Cath, 25 Nov 2026).
--
-- The parent approval answer lives in launchpad_learner_ventures.wrap_up_confirmed_at
-- under the "parent-approval-*" keys (requested, yes, no, and the email markers).
-- Learners can update their own row (launchpad_learner_ventures_update_own), so
-- before this a learner could write "parent-approval-yes" with their own session
-- and pass their own stop.
--
-- This trigger refuses any insert or update from a signed-in user (or anon) that
-- adds, changes or removes a "parent-approval-*" key. Only the server, with the
-- service role, writes them: the learner's request, and the linked parent's
-- answer after the Parent PIN. Every other column, and every other key in the
-- map, works as before. No data changes.

create or replace function public.launchpad_guard_parent_approval()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_keys jsonb := '{}'::jsonb;
  new_keys jsonb;
begin
  -- Signed-in users and anon reach the table as these roles. The service role
  -- (the server) and database owners are not limited here.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if tg_op = 'UPDATE' and jsonb_typeof(old.wrap_up_confirmed_at) = 'object' then
    select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb) into old_keys
    from jsonb_each(old.wrap_up_confirmed_at) as e
    where e.key like 'parent-approval-%';
  end if;
  new_keys := '{}'::jsonb;
  if jsonb_typeof(new.wrap_up_confirmed_at) = 'object' then
    select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb) into new_keys
    from jsonb_each(new.wrap_up_confirmed_at) as e
    where e.key like 'parent-approval-%';
  end if;
  if new_keys is distinct from old_keys then
    raise exception 'Only the linked parent can answer the Launchpad parent approval.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

comment on function public.launchpad_guard_parent_approval() is
  'Self-approve lock: a learner session cannot add, change or remove parent-approval-* keys in launchpad_learner_ventures.wrap_up_confirmed_at. Only the service role writes them.';

drop trigger if exists launchpad_learner_ventures_parent_approval_lock on public.launchpad_learner_ventures;
create trigger launchpad_learner_ventures_parent_approval_lock
  before insert or update on public.launchpad_learner_ventures
  for each row
  execute function public.launchpad_guard_parent_approval();
