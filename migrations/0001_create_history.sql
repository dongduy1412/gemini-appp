-- Create history table
CREATE TABLE IF NOT EXISTS image_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  transform_type TEXT NOT NULL,
  input_images TEXT NOT NULL,
  output_image TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_history_user_id ON image_history(user_id);
CREATE INDEX idx_history_created_at ON image_history(created_at DESC);