-- ============================================================================
-- TrackStack 2.0 follow-up
--
-- Likes and comments can target catalogue albums that are not saved locally,
-- so their identifiers are text rather than uuid.
-- ============================================================================

ALTER TABLE likes
  ALTER COLUMN target_id TYPE text USING target_id::text;

ALTER TABLE comments
  ALTER COLUMN target_id TYPE text USING target_id::text;

DROP INDEX IF EXISTS likes_target_idx;
CREATE INDEX IF NOT EXISTS likes_target_idx ON likes (target_type, target_id);

DROP INDEX IF EXISTS comments_target_idx;
CREATE INDEX IF NOT EXISTS comments_target_idx ON comments (target_type, target_id, created_at DESC);
