-- ============================================================================
-- TrackStack 2.0 follow-up: replies to comments.
--
-- A reply points at the comment it answers. The target type and target id on
-- the reply stay the same as the parent, so a comment thread belongs to one
-- album or collection. Likes already store text ids, so comment likes need no
-- schema change.
-- ============================================================================

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS comments_parent_idx ON comments (parent_id);
