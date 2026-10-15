-- Class password at rest: AES-256-GCM ciphertext in class_password_enc.
-- Safe to run more than once. Does not delete class_password; the app (or
-- scripts/backfill-class-password-enc.ts) copies existing plaintext into
-- class_password_enc and then sets class_password to null.
--
-- Paste this file into the Supabase SQL editor. service_role keeps table
-- access and performs the encrypt/decrypt. Browser roles cannot read or
-- write either password column.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS class_password_enc text;

COMMENT ON COLUMN public.profiles.class_password_enc IS
  'AES-256-GCM ciphertext (v1.<iv>.<tag>.<ciphertext>, base64url) of the shared classroom login. Additional authenticated data is this profile id. Key is server env CLASS_PASSWORD_KEY. Never selected by browser clients.';

COMMENT ON COLUMN public.profiles.class_password IS
  'Legacy plaintext classroom login. Null after it is copied into class_password_enc. Do not write new plaintext.';

CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NULL OR (auth.jwt() ->> 'role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.account_role IS DISTINCT FROM OLD.account_role
     OR NEW.account_status IS DISTINCT FROM OLD.account_status
     OR NEW.consent_approved_at IS DISTINCT FROM OLD.consent_approved_at
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.is_teacher IS DISTINCT FROM OLD.is_teacher
     OR NEW.seat_cap IS DISTINCT FROM OLD.seat_cap
     OR NEW.class_password IS DISTINCT FROM OLD.class_password
     OR NEW.class_password_enc IS DISTINCT FROM OLD.class_password_enc
     OR NEW.class_cohort IS DISTINCT FROM OLD.class_cohort
     OR NEW.teacher_id IS DISTINCT FROM OLD.teacher_id
  THEN
    RAISE EXCEPTION 'Cannot change protected profile fields from the client';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE SELECT (class_password, class_password_enc)
  ON TABLE public.profiles
  FROM PUBLIC, anon, authenticated;

REVOKE UPDATE (class_password, class_password_enc)
  ON TABLE public.profiles
  FROM PUBLIC, anon, authenticated;

REVOKE INSERT (class_password, class_password_enc)
  ON TABLE public.profiles
  FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
