CREATE TABLE IF NOT EXISTS horses (
  id TEXT PRIMARY KEY,
  name_jp TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  csv_data TEXT NOT NULL,
  parent_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES horses(id)
);
