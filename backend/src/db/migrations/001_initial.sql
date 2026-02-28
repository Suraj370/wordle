-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Players ──────────────────────────────────────────────────────────────────
-- Represents any identity: guest or registered user.
-- Game logic exclusively operates on player_id.
CREATE TABLE IF NOT EXISTS players (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type       VARCHAR(10) NOT NULL CHECK (type IN ('guest', 'user')),
  user_id    UUID        NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);

-- ─── Users ───────────────────────────────────────────────────────────────────
-- Registered accounts. Linked to a player record.
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Games ───────────────────────────────────────────────────────────────────
-- One row per player per day. Guesses stored as JSONB.
CREATE TABLE IF NOT EXISTS games (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  date          DATE        NOT NULL,
  word_id       INTEGER     NOT NULL,
  guesses       JSONB       NOT NULL DEFAULT '[]',
  status        VARCHAR(10) NOT NULL DEFAULT 'playing' CHECK (status IN ('playing', 'won', 'lost')),
  attempt_count INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_game_player_date UNIQUE (player_id, date)
);

CREATE INDEX IF NOT EXISTS idx_games_player_id ON games(player_id);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);

-- ─── User Stats ──────────────────────────────────────────────────────────────
-- Aggregate stats keyed by player_id.
CREATE TABLE IF NOT EXISTS user_stats (
  player_id      UUID    PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  games_played   INTEGER NOT NULL DEFAULT 0,
  wins           INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  max_streak     INTEGER NOT NULL DEFAULT 0
);
