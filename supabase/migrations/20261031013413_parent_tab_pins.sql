-- Parent tab PIN, stored server-side (Cath approved on voice, 31 Oct 2026 11:29am).
-- Server actions only (service role). No client grants, so the hash, failed tries and lockout can't be read or reset from the browser.
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
comment on table public.parent_tab_pins is 'Parent tab PIN (PBKDF2-SHA-256 hash + salt). Server actions only. Not the parent-data PIN.';
alter table public.parent_tab_pins enable row level security;
revoke all on public.parent_tab_pins from anon, authenticated;
create or replace function public.parent_tab_pins_touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end; $$;
drop trigger if exists parent_tab_pins_touch_updated_at on public.parent_tab_pins;
create trigger parent_tab_pins_touch_updated_at before update on public.parent_tab_pins
  for each row execute function public.parent_tab_pins_touch_updated_at();
