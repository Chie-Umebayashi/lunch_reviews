-- Optional review photo stored as a data URL (data:image/...;base64,...)
-- Apply after 001_initial_schema.sql:
--   psql "$DATABASE_URL" -f db/migrations/002_review_image_url.sql
-- If psql reports "invalid URI query parameter: schema", strip the query string (e.g. ?schema=public):
--   psql "${DATABASE_URL%%\?*}" -f db/migrations/002_review_image_url.sql

BEGIN;

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS image_url text;

COMMIT;
