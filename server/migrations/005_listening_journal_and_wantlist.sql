ALTER TABLE collection_albums
  ADD COLUMN IF NOT EXISTS memory_location varchar(200),
  ADD COLUMN IF NOT EXISTS memory_with varchar(200),
  ADD COLUMN IF NOT EXISTS memory_note varchar(1000);

ALTER TABLE wantlist_items
  ADD COLUMN IF NOT EXISTS max_price numeric(10,2);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wantlist_items_max_price_nonnegative') THEN
    ALTER TABLE wantlist_items ADD CONSTRAINT wantlist_items_max_price_nonnegative
      CHECK (max_price IS NULL OR max_price >= 0);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS listening_queue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  album_id uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  position integer NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, album_id)
);
CREATE INDEX IF NOT EXISTS listening_queue_user_position_idx
  ON listening_queue_items (user_id, position, added_at);
