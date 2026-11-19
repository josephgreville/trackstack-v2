-- ============================================================================
-- Google sign-in.
--
-- Password accounts keep their existing hash. Google accounts store the stable
-- Google subject id instead, so they do not need a local password. A verified
-- Google email can link to an existing password account with the same address.
-- ============================================================================

ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS auth_provider text NOT NULL DEFAULT 'password',
  ADD COLUMN IF NOT EXISTS provider_id text,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS users_provider_identity_unique
  ON users (auth_provider, provider_id)
  WHERE provider_id IS NOT NULL;
