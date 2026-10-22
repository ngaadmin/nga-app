-- Do not apply until Cath says so.
--
-- authenticated has table-level SELECT on public.profiles, so the column
-- REVOKEs on parent_pin_hash, class_password, class_password_enc,
-- parent_pin_reset_hash, and parent_pin_reset_expires_at do nothing.
-- Revoke that table-level SELECT from anon and authenticated, then grant
-- SELECT again on every other existing column.
-- class_password stays withheld with the other secret columns. It was already
-- meant to be unreadable, and a fresh column grant would put it back.
-- service_role is unchanged. This script does not INSERT, UPDATE, or DELETE
-- any row. Do not run it from the app or against production.

REVOKE SELECT ON TABLE public.profiles FROM anon, authenticated;

GRANT SELECT (
  id,
  username,
  account_role,
  account_status,
  curriculum_cohort,
  marketing_opt_in,
  consent_approved_at,
  created_at,
  updated_at,
  is_teacher,
  seat_cap,
  teacher_id,
  class_cohort,
  parent_approval_required,
  age_checked_at,
  inactivity_warning_sent_at
) ON TABLE public.profiles TO authenticated;
