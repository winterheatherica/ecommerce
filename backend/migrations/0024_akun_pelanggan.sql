CREATE TABLE users (
  id bigserial PRIMARY KEY,
  google_sub text NOT NULL UNIQUE,
  email text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX users_email_idx ON users (lower(email));

CREATE TABLE sessions (
  id bigserial PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  user_id bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_expires_idx ON sessions (expires_at);

ALTER TABLE orders ADD COLUMN user_id bigint REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX orders_user_idx ON orders (user_id, created_at DESC);
CREATE INDEX orders_guest_email_idx ON orders (lower(email)) WHERE user_id IS NULL;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
