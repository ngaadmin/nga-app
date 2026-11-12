--
-- Launchpad venture content: versioned per-venture payloads, plus one current
-- pointer per venture. Mirrors 20261026001000_academy_lesson_versions.sql.
--
-- Applied in prod on 4 Nov as 20261103223752_launchpad_venture_content.
-- dog-walking has a published schema 4 version. Previews read these tables
-- for ventures listed in LAUNCHPAD_DB_VENTURES. Production and local stay on
-- the bundled seed unless LAUNCHPAD_CONTENT_DB is explicitly on.
--
-- Additive only: creates two new tables, their constraints, RLS policies and
-- grants. It does not alter, drop or write to any existing table, and creates
-- no storage bucket. Idempotent: every statement is safe to run again.
--
-- A rejected publish does not change the pointer, so the last good version
-- stays served. anon and authenticated may read. They cannot insert, update,
-- or delete. The service role writes; it is not granted here and must not
-- ship to the browser.
--
-- Payload shape: lib/launchpad/content/types.ts (LaunchpadVenturePayload),
-- validated by lib/launchpad/content/check-payload.ts before any write.
-- Level Up statements (id, section, label, pace) and the Reflect, Improve,
-- and Grow copy are fields inside that jsonb payload, not extra columns, so
-- a future read with LAUNCHPAD_CONTENT_DB on carries them with the rest.
-- Schema 4 also stores shared learner-facing strings on payload.surface.

create table if not exists public.launchpad_venture_versions (
  id uuid primary key default gen_random_uuid(),
  venture_id text not null check (venture_id ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  content_hash text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint launchpad_venture_versions_venture_hash unique (venture_id, content_hash)
);

create table if not exists public.launchpad_venture_current (
  venture_id text primary key check (venture_id ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  version_id uuid not null,
  updated_at timestamptz not null default now(),
  constraint launchpad_venture_current_version_fk
    foreign key (version_id) references public.launchpad_venture_versions (id)
);

alter table public.launchpad_venture_versions enable row level security;
alter table public.launchpad_venture_current enable row level security;

drop policy if exists launchpad_venture_versions_read on public.launchpad_venture_versions;
create policy launchpad_venture_versions_read
  on public.launchpad_venture_versions
  for select
  to anon, authenticated
  using (true);

drop policy if exists launchpad_venture_current_read on public.launchpad_venture_current;
create policy launchpad_venture_current_read
  on public.launchpad_venture_current
  for select
  to anon, authenticated
  using (true);

revoke all on table public.launchpad_venture_versions from anon, authenticated;
revoke all on table public.launchpad_venture_current from anon, authenticated;
grant select on table public.launchpad_venture_versions to anon, authenticated;
grant select on table public.launchpad_venture_current to anon, authenticated;
