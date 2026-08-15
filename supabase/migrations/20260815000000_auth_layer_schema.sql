-- =============================================================================
-- Auth-layer schema (profiles, household links, consent requests)
-- Run in the Supabase SQL Editor or via the migration runner.
-- Academy / Vault / wallet progress stays local — not part of this layer.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS citext;

-- -----------------------------------------------------------------------------
-- 1. profiles — one row per auth.users id
--    Stub row is created by trigger; signup fills the rest.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username citext UNIQUE,
  birth_year integer,
  account_role text NOT NULL DEFAULT 'child',
  account_status text NOT NULL DEFAULT 'pending_consent',
  curriculum_cohort text,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  consent_approved_at timestamptz,
  parent_pin_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profiles_username_format_check
    CHECK (
      username IS NULL
      OR username ~ '^[A-Za-z0-9_-]{2,20}$'
    ),
  CONSTRAINT profiles_birth_year_check
    CHECK (
      birth_year IS NULL
      OR (
        birth_year >= 1900
        AND birth_year <= EXTRACT(YEAR FROM CURRENT_DATE)::integer
      )
    ),
  CONSTRAINT profiles_account_role_check
    CHECK (account_role IN ('child', 'parent_master')),
  CONSTRAINT profiles_account_status_check
    CHECK (account_status IN ('pending_consent', 'active')),
  CONSTRAINT profiles_curriculum_cohort_check
    CHECK (
      curriculum_cohort IS NULL
      OR curriculum_cohort IN ('explorer', 'pathfinder', 'maverick')
    ),
  CONSTRAINT profiles_parent_pin_role_check
    CHECK (
      parent_pin_hash IS NULL
      OR account_role = 'parent_master'
    )
);

COMMENT ON TABLE public.profiles IS
  'App profile for each Supabase Auth user. Legal age comes from birth_year; do not store age_tier.';

COMMENT ON COLUMN public.profiles.id IS
  'Same uuid as auth.users.id.';

COMMENT ON COLUMN public.profiles.username IS
  'Public login name. Unique case-insensitively (citext). Stubbed at auth signup, replaced in the app signup flow.';

COMMENT ON COLUMN public.profiles.birth_year IS
  'Legal source of truth for COPPA / parent gates. Required for children after signup; null for parent masters.';

COMMENT ON COLUMN public.profiles.account_role IS
  'child | parent_master. Default child until signup sets the real role.';

COMMENT ON COLUMN public.profiles.account_status IS
  'pending_consent | active. Explorers stay pending until VPC is approved.';

COMMENT ON COLUMN public.profiles.curriculum_cohort IS
  'Optional Academy track override. Never use this for parental / COPPA rules.';

COMMENT ON COLUMN public.profiles.marketing_opt_in IS
  'Forced false for Explorers. Default false.';

COMMENT ON COLUMN public.profiles.consent_approved_at IS
  'Set when Explorer verifiable parental consent is approved.';

COMMENT ON COLUMN public.profiles.parent_pin_hash IS
  'Parent Hub PIN hash (not the login password). Parent masters only.';

CREATE INDEX IF NOT EXISTS profiles_account_role_idx
  ON public.profiles (account_role);

CREATE INDEX IF NOT EXISTS profiles_account_status_idx
  ON public.profiles (account_status);

-- -----------------------------------------------------------------------------
-- 2. parent_child — established household link (one parent per child)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.parent_child (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT parent_child_child_unique UNIQUE (child_id),
  CONSTRAINT parent_child_pair_unique UNIQUE (parent_id, child_id),
  CONSTRAINT parent_child_not_self_check CHECK (parent_id <> child_id)
);

COMMENT ON TABLE public.parent_child IS
  'Confirmed parent ↔ child link. Created after Explorer VPC approval or Pathfinder parent claim.';

COMMENT ON COLUMN public.parent_child.parent_id IS
  'Must be a parent_master profile (enforced by trigger).';

COMMENT ON COLUMN public.parent_child.child_id IS
  'Must be a child profile. Unique — one parent per child.';

CREATE INDEX IF NOT EXISTS parent_child_parent_id_idx
  ON public.parent_child (parent_id);

-- -----------------------------------------------------------------------------
-- 3. consent_requests — Explorer VPC + Pathfinder parent-claim invites
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.consent_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  child_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  parent_email citext NOT NULL,
  parent_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,

  CONSTRAINT consent_requests_kind_check
    CHECK (kind IN ('vpc', 'parent_claim')),
  CONSTRAINT consent_requests_status_check
    CHECK (status IN ('pending', 'approved', 'expired', 'cancelled')),
  CONSTRAINT consent_requests_token_hash_unique UNIQUE (token_hash),
  CONSTRAINT consent_requests_parent_email_format_check
    CHECK (parent_email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$')
);

COMMENT ON TABLE public.consent_requests IS
  'Guardian email invites. kind=vpc blocks Explorer ACTIVE; kind=parent_claim is Pathfinder FYI / claim.';

COMMENT ON COLUMN public.consent_requests.token_hash IS
  'Hash of the emailed token. Never store the raw token.';

COMMENT ON COLUMN public.consent_requests.parent_email IS
  'Guardian contact before they have an account. Used to match a later parent login.';

COMMENT ON COLUMN public.consent_requests.parent_id IS
  'Filled when a matching parent master exists or is created.';

CREATE INDEX IF NOT EXISTS consent_requests_child_id_idx
  ON public.consent_requests (child_id);

CREATE INDEX IF NOT EXISTS consent_requests_parent_id_idx
  ON public.consent_requests (parent_id);

CREATE INDEX IF NOT EXISTS consent_requests_parent_email_idx
  ON public.consent_requests (parent_email);

CREATE INDEX IF NOT EXISTS consent_requests_status_expires_idx
  ON public.consent_requests (status, expires_at);

-- -----------------------------------------------------------------------------
-- 4. Triggers
-- -----------------------------------------------------------------------------

-- Keep updated_at current on profile edits.
CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profiles_updated_at();

-- Create a stub profile when Auth creates a user.
-- Signup overwrites username / birth_year / role / status afterwards.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, account_role, account_status, marketing_opt_in)
  VALUES (
    NEW.id,
    'u' || substr(replace(NEW.id::text, '-', ''), 1, 19),
    'child',
    'pending_consent',
    false
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
  'Stub profile for every new auth.users row. Placeholder username is unique and valid (20 chars).';

-- Clients may update their own profile, but not lifecycle / identity keys.
-- service_role and SQL-editor (no jwt) can still set those fields.
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
  THEN
    RAISE EXCEPTION 'Cannot change protected profile fields from the client';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_columns ON public.profiles;
CREATE TRIGGER profiles_protect_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_columns();

-- Household rows must point at a parent_master and a child.
CREATE OR REPLACE FUNCTION public.validate_parent_child_roles()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  parent_role text;
  child_role text;
BEGIN
  SELECT account_role INTO parent_role
  FROM public.profiles
  WHERE id = NEW.parent_id;

  SELECT account_role INTO child_role
  FROM public.profiles
  WHERE id = NEW.child_id;

  IF parent_role IS DISTINCT FROM 'parent_master' THEN
    RAISE EXCEPTION 'parent_id must reference a parent_master profile';
  END IF;

  IF child_role IS DISTINCT FROM 'child' THEN
    RAISE EXCEPTION 'child_id must reference a child profile';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS parent_child_validate_roles ON public.parent_child;
CREATE TRIGGER parent_child_validate_roles
  BEFORE INSERT OR UPDATE ON public.parent_child
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_parent_child_roles();

-- -----------------------------------------------------------------------------
-- 5. Grants — authenticated can use the tables; anon cannot.
--    service_role keeps full access (bypasses RLS).
-- -----------------------------------------------------------------------------

REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
REVOKE ALL ON TABLE public.parent_child FROM anon, authenticated;
REVOKE ALL ON TABLE public.consent_requests FROM anon, authenticated;

GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.parent_child TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.consent_requests TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_child ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_requests ENABLE ROW LEVEL SECURITY;

-- profiles: read own row, or a child you are linked to
DROP POLICY IF EXISTS profiles_select_own_or_linked_child ON public.profiles;
CREATE POLICY profiles_select_own_or_linked_child
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.parent_child pc
      WHERE pc.parent_id = auth.uid()
        AND pc.child_id = profiles.id
    )
  );

-- profiles: update own row only (protected columns blocked by trigger)
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- parent_child: parent or child can see the link.
-- Inserts/deletes are service-role / server-action only (no authenticated policy).
DROP POLICY IF EXISTS parent_child_select_household ON public.parent_child;
CREATE POLICY parent_child_select_household
  ON public.parent_child
  FOR SELECT
  TO authenticated
  USING (
    parent_id = auth.uid()
    OR child_id = auth.uid()
  );

-- consent_requests: child, linked parent, or signed-in user whose email matches
DROP POLICY IF EXISTS consent_requests_select_involved ON public.consent_requests;
CREATE POLICY consent_requests_select_involved
  ON public.consent_requests
  FOR SELECT
  TO authenticated
  USING (
    child_id = auth.uid()
    OR parent_id = auth.uid()
    OR parent_email = (auth.jwt() ->> 'email')::citext
  );

-- consent_requests: child creates their own invite
DROP POLICY IF EXISTS consent_requests_insert_own_child ON public.consent_requests;
CREATE POLICY consent_requests_insert_own_child
  ON public.consent_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (child_id = auth.uid());

-- consent_requests: child may cancel their own pending row
DROP POLICY IF EXISTS consent_requests_update_child_cancel ON public.consent_requests;
CREATE POLICY consent_requests_update_child_cancel
  ON public.consent_requests
  FOR UPDATE
  TO authenticated
  USING (
    child_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    child_id = auth.uid()
    AND status = 'cancelled'
  );

-- consent_requests: parent may update a request addressed to them
-- (approve / expire). Server should still set approved_by / parent_id.
DROP POLICY IF EXISTS consent_requests_update_parent ON public.consent_requests;
CREATE POLICY consent_requests_update_parent
  ON public.consent_requests
  FOR UPDATE
  TO authenticated
  USING (
    parent_id = auth.uid()
    OR parent_email = (auth.jwt() ->> 'email')::citext
  )
  WITH CHECK (
    parent_id = auth.uid()
    OR parent_email = (auth.jwt() ->> 'email')::citext
  );
