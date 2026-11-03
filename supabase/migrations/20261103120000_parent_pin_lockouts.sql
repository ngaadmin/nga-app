-- Wrong-PIN lockout for the one Parent PIN (profiles.parent_pin_hash), stored in the database so it holds across every server instance.
-- Rule: 5 wrong tries, then a 5-minute lock. A correct PIN or a PIN reset clears the row.
-- Server only (service role). No client grants, so the browser can't read or reset the counters.
-- Approved by Cath on voice, 3 Nov 2026 8:13pm AEST. Additive only: one new empty table, nothing else changes.
create table if not exists public.parent_pin_lockouts (
  parent_id uuid primary key references public.profiles (id) on delete cascade,
  failed_tries smallint not null default 0 check (failed_tries between 0 and 5),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);
comment on table public.parent_pin_lockouts is 'Parent PIN wrong-try counter and lock (5 misses = 5-minute lock). Server actions only. No PIN or hash is stored here.';
alter table public.parent_pin_lockouts enable row level security;
revoke all on public.parent_pin_lockouts from anon, authenticated;
grant select, insert, update, delete on public.parent_pin_lockouts to service_role;
