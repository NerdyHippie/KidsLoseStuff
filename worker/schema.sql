-- Lost & Found Schema
-- Run with: wrangler d1 execute kids-lose-stuff --file=schema.sql

CREATE TABLE IF NOT EXISTS schools (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  slug      TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS faculty (
  id         TEXT PRIMARY KEY,
  school_id  TEXT NOT NULL REFERENCES schools(id),
  email      TEXT NOT NULL,
  name       TEXT,
  role       TEXT NOT NULL DEFAULT 'staff', -- 'schooladmin' | 'staff'
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(school_id, email)
);

CREATE TABLE IF NOT EXISTS items (
  id          TEXT PRIMARY KEY,
  school_id   TEXT NOT NULL REFERENCES schools(id),
  description TEXT NOT NULL,
  image_key   TEXT NOT NULL,          -- R2 object key
  status      TEXT NOT NULL DEFAULT 'unclaimed', -- 'unclaimed' | 'claimed'
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by  TEXT NOT NULL REFERENCES faculty(id)
);

CREATE TABLE IF NOT EXISTS claims (
  id           TEXT PRIMARY KEY,
  item_id      TEXT NOT NULL UNIQUE REFERENCES items(id) ON DELETE CASCADE,
  initials     TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  claimed_at   INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_items_school    ON items(school_id, status);
CREATE INDEX IF NOT EXISTS idx_faculty_email   ON faculty(email);
CREATE INDEX IF NOT EXISTS idx_claims_item     ON claims(item_id);
