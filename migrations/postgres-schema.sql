-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generations table
CREATE TABLE IF NOT EXISTS generations (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  transform_type VARCHAR(50) NOT NULL,
  input_images TEXT NOT NULL,
  output_image TEXT NOT NULL,
  prompt_used TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);

-- Rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  user_id VARCHAR(255) PRIMARY KEY,
  count INTEGER DEFAULT 0,
  reset_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);