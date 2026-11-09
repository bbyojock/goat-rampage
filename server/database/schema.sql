-- GOAT RAMPAGE PostgreSQL Database Schema
-- Covers all 7 core tables specified in prompt.txt Section 12:
-- users, profiles, progress, characters, matches, rankings, settings

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(32) UNIQUE NOT NULL,
  password_hash VARCHAR(256) NOT NULL,
  salt VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  exp INTEGER NOT NULL DEFAULT 0,
  coins INTEGER NOT NULL DEFAULT 200,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS progress (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_region VARCHAR(32) NOT NULL DEFAULT 'GREEN_VALLEY',
  unlocked_regions JSONB NOT NULL DEFAULT '["GREEN_VALLEY"]'::jsonb,
  completed_quests JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_quest_progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS characters (
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  character_id VARCHAR(32) NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mastery_exp INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, character_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id VARCHAR(64) PRIMARY KEY,
  player1_id VARCHAR(64) NOT NULL,
  player2_id VARCHAR(64) NOT NULL,
  player1_char VARCHAR(32) NOT NULL,
  player2_char VARCHAR(32) NOT NULL,
  mode VARCHAR(32) NOT NULL,
  winner_slot SMALLINT NOT NULL,
  score VARCHAR(16) NOT NULL,
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rankings (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(32) NOT NULL,
  rating INTEGER NOT NULL DEFAULT 1000,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  season INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bgm_volume REAL NOT NULL DEFAULT 0.5,
  sfx_volume REAL NOT NULL DEFAULT 0.75,
  graphics_quality VARCHAR(16) NOT NULL DEFAULT 'HIGH',
  touch_control_scale REAL NOT NULL DEFAULT 1.0,
  touch_control_opacity REAL NOT NULL DEFAULT 0.82,
  show_touch_controls VARCHAR(16) NOT NULL DEFAULT 'AUTO',
  key_bindings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rankings_rating ON rankings(rating DESC);
CREATE INDEX IF NOT EXISTS idx_matches_played_at ON matches(played_at DESC);
