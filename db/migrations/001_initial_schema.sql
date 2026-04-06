-- Initial schema: users, reviews, review_likes (PostgreSQL 14+)
--
-- Apply from host (compose のポート転送時):
--   psql "postgresql://postgres:password@localhost:5432/postgres" -f db/migrations/001_initial_schema.sql
-- Apply from app コンテナ内（同一 compose ネットワーク）:
--   psql "postgresql://postgres:password@db:5432/postgres" -f /workspaces/<repo>/db/migrations/001_initial_schema.sql

BEGIN;

CREATE TABLE users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  display_name text NOT NULL,
  email text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint REFERENCES users (id) ON DELETE SET NULL,
  author_display_name text NOT NULL,
  comment text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  likes_count integer NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reviews_created_at_idx ON reviews (created_at DESC);
CREATE INDEX reviews_lat_lng_idx ON reviews (latitude, longitude);

CREATE TABLE review_likes (
  review_id bigint NOT NULL REFERENCES reviews (id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (review_id, user_id)
);

CREATE INDEX review_likes_user_id_idx ON review_likes (user_id);

-- likes_count は review_likes の行数と一致させる（アプリは INSERT/DELETE のみ推奨）
CREATE OR REPLACE FUNCTION reviews_sync_likes_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews SET likes_count = likes_count + 1 WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reviews SET likes_count = likes_count - 1 WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER review_likes_sync_insert
AFTER INSERT ON review_likes
FOR EACH ROW EXECUTE FUNCTION reviews_sync_likes_count();

CREATE TRIGGER review_likes_sync_delete
AFTER DELETE ON review_likes
FOR EACH ROW EXECUTE FUNCTION reviews_sync_likes_count();

COMMIT;
