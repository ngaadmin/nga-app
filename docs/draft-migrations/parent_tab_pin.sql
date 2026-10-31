-- DRAFT ONLY. NOT APPLIED. Not in supabase/migrations on purpose.
-- Parent tab PIN, stored server-side as a hash so the server can verify it
-- (today's test build keeps the hash on the device only).
--
-- Separate from profiles.parent_pin_hash (the "My child's data" PIN), so
-- the two PINs can differ. Nothing here touches switching into the parent
-- profile, which stays PIN-free.
--
-- Plan once approved:
--   1. Copy to supabase/migrations/<timestamp>_parent_tab_pins.sql and apply.
--   2. openParentTabGate(pin) verifies the PIN on the server (PBKDF2 with the
--      stored salt + iterations, constant-time compare), counts failed tries,
--      sets locked_until = now() + 5 minutes after 5 misses, and only then
--      signs the short-lived in-memory gate pass.
--   3. Drop the device-only store (lib/parent/parent-tab-pin.ts).
--
-- Writes from the app go through server actions with the service role, so
-- the RLS below is defense in depth: a parent can read and update only
-- their own row, and only parent accounts can have one.

create table if not exists public.parent_tab_pins (
  parent_id uuid primary key references public.profiles (id) on delete cascade,
  pin_hash text not null,
  pin_salt text not null,
  pin_iterations integer not null default 150000 check (pin_iterations >= 100000),
  failed_tries smallint not null default 0 check (failed_tries between 0 and 5),
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.parent_tab_pins is
  'Parent tab PIN (PBKDF2-SHA-256 hash + salt). Asked every time the Parent tab opens. Not the parent-data PIN.';

alter table public.parent_tab_pins enable row level security;

-- Only the parent themself, and only if the profile is a parent master.
create policy parent_tab_pins_select_own
  on public.parent_tab_pins
  for select
  to authenticated
  using (
    parent_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.account_role = 'parent_master'
    )
  );

create policy parent_tab_pins_insert_own
  on public.parent_tab_pins
  for insert
  to authenticated
  with check (
    parent_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.account_role = 'parent_master'
    )
  );

create policy parent_tab_pins_update_own
  on public.parent_tab_pins
  for update
  to authenticated
  using (parent_id = auth.uid())
  with check (
    parent_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.account_role = 'parent_master'
    )
  );

-- No delete policy: resetting a forgotten PIN goes through a server action
-- after the parent re-confirms their password.

-- Never expose the hash columns to anon; authenticated reads are limited by RLS.
-- Note: even own-row reads expose the hash, and a 4-digit PIN is easy to
-- brute-force offline. Prefer reading only from server actions (service role)
-- and, if Cath agrees, drop the select grant for authenticated below.
revoke all on public.parent_tab_pins from anon;
grant select, insert, update on public.parent_tab_pins to authenticated;

create or replace function public.parent_tab_pins_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger parent_tab_pins_touch_updated_at
  before update on public.parent_tab_pins
  for each row execute function public.parent_tab_pins_touch_updated_at();
