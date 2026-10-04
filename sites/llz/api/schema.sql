
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE COLLATE NOCASE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  xp INTEGER NOT NULL DEFAULT 0,
  llt INTEGER NOT NULL DEFAULT 100,
  labcard_skin TEXT NOT NULL DEFAULT 'default',
  avatar_id TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  settings_json TEXT NOT NULL DEFAULT '{}',
  reset_token_hash TEXT,
  reset_expires TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Unique email index for live DBs is created in migrate() after ADD COLUMN.
CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);


CREATE TABLE IF NOT EXISTS challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  track TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  points INTEGER NOT NULL,
  summary TEXT NOT NULL,
  learn TEXT NOT NULL,
  body_html TEXT NOT NULL,
  flag_hash TEXT NOT NULL,
  hint TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS solves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  solved_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS forum_threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id),
  tags TEXT NOT NULL DEFAULT '',
  pinned INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_nok INTEGER NOT NULL,
  blurb TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '✦'
);

CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS llt_unlocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  ref TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, kind, ref)
);

CREATE TABLE IF NOT EXISTS llt_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS community_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'general',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_community_posts_topic ON community_posts(topic);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);

CREATE TABLE IF NOT EXISTS user_titles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, title_id)
);

-- LLZ LabZocial (last_seen column added via migrate() try/except on live DBs)
-- LabZocial profile fields live in users.settings_json.zocial (bio, fav_tool, fav_distro, …)
-- No separate table — avoids DB wipe; merge via /account/zocial

CREATE TABLE IF NOT EXISTS friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_a, user_b),
  CHECK (user_a != user_b),
  CHECK (status IN ('pending','accepted'))
);
CREATE INDEX IF NOT EXISTS idx_friendships_b_status ON friendships(user_b, status);
CREATE INDEX IF NOT EXISTS idx_friendships_a_status ON friendships(user_a, status);

CREATE TABLE IF NOT EXISTS post_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(post_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);

CREATE TABLE IF NOT EXISTS post_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);

CREATE TABLE IF NOT EXISTS dm_threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_low INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_high INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_low, user_high),
  CHECK (user_low < user_high)
);
CREATE TABLE IF NOT EXISTS dm_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL REFERENCES dm_threads(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'user',
  body TEXT NOT NULL,
  meta TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  read_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_dm_messages_thread ON dm_messages(thread_id, id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_recipient_unread ON dm_messages(recipient_id, read_at);
