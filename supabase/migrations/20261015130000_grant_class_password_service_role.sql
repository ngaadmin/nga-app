-- service_role encrypts and decrypts class passwords. Browser roles stay revoked.
-- Explicit grants cover the case where column-level REVOKE from PUBLIC left
-- service_role unable to read class_password or class_password_enc.
-- Safe to run more than once.

GRANT SELECT (class_password, class_password_enc)
  ON TABLE public.profiles
  TO service_role;

GRANT UPDATE (class_password, class_password_enc)
  ON TABLE public.profiles
  TO service_role;

GRANT INSERT (class_password, class_password_enc)
  ON TABLE public.profiles
  TO service_role;
