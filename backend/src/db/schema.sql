-- TabMemory Database Schema

-- Users table (for future multi-user support)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved tabs
CREATE TABLE IF NOT EXISTS tabs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) DEFAULT 1,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  fav_icon_url TEXT,
  content TEXT,
  description TEXT,
  summary TEXT,
  summary_generated_at TIMESTAMP,
  saved_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Digests
CREATE TABLE IF NOT EXISTS digests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) DEFAULT 1,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  content TEXT NOT NULL,
  tab_count INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tabs_user_id ON tabs(user_id);
CREATE INDEX IF NOT EXISTS idx_tabs_saved_at ON tabs(saved_at);
CREATE INDEX IF NOT EXISTS idx_tabs_user_saved ON tabs(user_id, saved_at);
CREATE INDEX IF NOT EXISTS idx_digests_user_id ON digests(user_id);
CREATE INDEX IF NOT EXISTS idx_digests_dates ON digests(start_date, end_date);

-- Insert default user
INSERT INTO users (id) VALUES (1) ON CONFLICT DO NOTHING;
