DROP TABLE IF EXISTS horses;
DROP TABLE IF EXISTS likes;

CREATE TABLE IF NOT EXISTS horses (
  id TEXT PRIMARY KEY,
  name_jp TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  csv_data TEXT NOT NULL,
  parent_id TEXT,
  delete_password_hash TEXT NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  ng_flag TEXT,
  FOREIGN KEY (parent_id) REFERENCES horses(id)
);

CREATE TABLE IF NOT EXISTS likes (
  horse_id TEXT NOT NULL,
  liker_token TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (horse_id, liker_token),
  FOREIGN KEY (horse_id) REFERENCES horses(id)
);
