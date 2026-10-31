--
-- Versioned Module 1 lesson payloads, plus one current pointer.
-- A rejected publish does not change the pointer, so the last good version stays served.
-- anon and authenticated may read. They cannot insert, update, or delete.
-- The service role writes. It is not granted here and must not ship to the browser.
--
-- academy-media is a public-read bucket. Objects are inserted by the upload
-- script with the service role. There is no update or delete policy, so a
-- name already in the bucket cannot be overwritten.

create table if not exists public.academy_lesson_versions (
  id uuid primary key default gen_random_uuid(),
  module_number integer not null check (module_number >= 1),
  content_hash text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint academy_lesson_versions_module_hash unique (module_number, content_hash)
);

create table if not exists public.academy_lesson_current (
  module_number integer primary key check (module_number >= 1),
  version_id uuid not null,
  updated_at timestamptz not null default now(),
  constraint academy_lesson_current_version_fk
    foreign key (version_id) references public.academy_lesson_versions (id)
);

alter table public.academy_lesson_versions enable row level security;
alter table public.academy_lesson_current enable row level security;

drop policy if exists academy_lesson_versions_read on public.academy_lesson_versions;
create policy academy_lesson_versions_read
  on public.academy_lesson_versions
  for select
  to anon, authenticated
  using (true);

drop policy if exists academy_lesson_current_read on public.academy_lesson_current;
create policy academy_lesson_current_read
  on public.academy_lesson_current
  for select
  to anon, authenticated
  using (true);

revoke all on table public.academy_lesson_versions from anon, authenticated;
revoke all on table public.academy_lesson_current from anon, authenticated;
grant select on table public.academy_lesson_versions to anon, authenticated;
grant select on table public.academy_lesson_current to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('academy-media', 'academy-media', true)
on conflict (id) do nothing;

drop policy if exists academy_media_public_read on storage.objects;
create policy academy_media_public_read
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'academy-media');
