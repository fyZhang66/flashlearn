-- Users
CREATE TABLE IF NOT EXISTS users (
  id             BIGSERIAL PRIMARY KEY,
  username       TEXT        NOT NULL UNIQUE,
  password_hash  TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions (server-side, keyed by opaque sid cookie).
-- Stored in Postgres so the app can run multiple replicas behind a k8s Service
-- without sticky sessions.
CREATE TABLE IF NOT EXISTS sessions (
  sid         TEXT        PRIMARY KEY,
  user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);

-- Cards
CREATE TABLE IF NOT EXISTS cards (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  front          TEXT        NOT NULL,
  explain        TEXT        NOT NULL,
  expire_ms      BIGINT      NOT NULL DEFAULT (7 * 24 * 60 * 60 * 1000),
  last_reviewed  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cards_user_idx ON cards(user_id);
CREATE INDEX IF NOT EXISTS cards_user_reviewed_idx ON cards(user_id, last_reviewed);

-- pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;
