CREATE TABLE identity.mobile_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  access_token_hash text NOT NULL UNIQUE CHECK (access_token_hash ~ '^[a-f0-9]{64}$'),
  refresh_token_hash text NOT NULL UNIQUE CHECK (refresh_token_hash ~ '^[a-f0-9]{64}$'),
  previous_refresh_token_hash text UNIQUE CHECK (previous_refresh_token_hash IS NULL OR previous_refresh_token_hash ~ '^[a-f0-9]{64}$'),
  access_expires_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  absolute_expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  device_name text NOT NULL DEFAULT 'Android device' CHECK (length(device_name) BETWEEN 1 AND 80),
  CHECK (access_expires_at <= expires_at),
  CHECK (expires_at <= absolute_expires_at)
);
CREATE INDEX mobile_sessions_user_active ON identity.mobile_sessions(user_id,expires_at) WHERE revoked_at IS NULL;
REVOKE ALL ON identity.mobile_sessions FROM public,rafik_guest,rafik_user;
GRANT SELECT,INSERT,UPDATE,DELETE ON identity.mobile_sessions TO rafik_api;
