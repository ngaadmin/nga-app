-- Security review findings 4 and 5. NOT APPLIED: test-only PR, apply only after Cath approves.
--
-- 1) Finding 5: shared rate limit for sign-in, password recovery/reset,
--    consent resend and email send, stored in the database so the limit
--    holds across every server instance (same pattern as parent_pin_lockouts).
--    The bucket key is a SHA-256 hash, so no IP address or email address is
--    stored. Server only (service role): no client grants.
--    Until this is applied, the app keeps using the per-instance in-memory
--    limit (lib/auth/shared-rate-limit.ts falls back automatically).
create table if not exists public.auth_rate_limits (
  key_hash text primary key check (key_hash ~ '^[0-9a-f]{64}$'),
  hit_count integer not null default 0 check (hit_count >= 0),
  window_reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);
create index if not exists auth_rate_limits_window_reset_at_idx
  on public.auth_rate_limits (window_reset_at);
comment on table public.auth_rate_limits is 'Fixed-window request counters for auth and email routes. Keys are SHA-256 hashes (no IP or email stored). Server actions only. Rows past window_reset_at are stale and safe to delete.';
alter table public.auth_rate_limits enable row level security;
revoke all on public.auth_rate_limits from anon, authenticated;
grant select, insert, update, delete on public.auth_rate_limits to service_role;

-- 2) Finding 4: parents must not update consent requests directly with their
--    own session (they could set status or approved fields themselves).
--    Approve, decline, resend and expiry all run on the server with the
--    service role, which bypasses RLS, so nothing in the app depends on
--    this policy. The child cancel policy and the select policy are kept.
drop policy if exists consent_requests_update_parent on public.consent_requests;
