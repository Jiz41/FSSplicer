-- FSSp v2.22.0: 馬タグ（今週のテーマ）。追加のみ。既存テーブルは変更しない。
CREATE TABLE IF NOT EXISTS horse_tags (
  horse_id TEXT NOT NULL,
  tag_type TEXT NOT NULL,
  tag_value TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (horse_id, tag_type, tag_value),
  FOREIGN KEY (horse_id) REFERENCES horses(id)
);
CREATE INDEX IF NOT EXISTS idx_horse_tags_value ON horse_tags(tag_type, tag_value);
