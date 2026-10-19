CREATE TABLE admin_sessions (
  id bigserial PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX admin_sessions_expires_idx ON admin_sessions (expires_at);

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
