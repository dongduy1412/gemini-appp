-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  image TEXT,
  google_id TEXT UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Sessions table  
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User images table
CREATE TABLE IF NOT EXISTS user_images (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  transform_type TEXT NOT NULL,
  input_images TEXT NOT NULL,
  output_image TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_user_images_user_id ON user_images(user_id);
