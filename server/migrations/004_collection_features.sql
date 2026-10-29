ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS collections_share_token_unique ON collections (share_token);

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_public boolean NOT NULL DEFAULT false;

ALTER TABLE collection_albums
  ADD COLUMN IF NOT EXISTS format varchar(20),
  ADD COLUMN IF NOT EXISTS condition varchar(20),
  ADD COLUMN IF NOT EXISTS purchase_date date,
  ADD COLUMN IF NOT EXISTS price numeric(10,2),
  ADD COLUMN IF NOT EXISTS edition_notes varchar(500);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'collection_albums_format_valid') THEN
    ALTER TABLE collection_albums ADD CONSTRAINT collection_albums_format_valid
      CHECK (format IS NULL OR format IN ('vinyl', 'cassette', 'cd', 'digital', 'other'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'collection_albums_condition_valid') THEN
    ALTER TABLE collection_albums ADD CONSTRAINT collection_albums_condition_valid
      CHECK (condition IS NULL OR condition IN ('mint', 'near_mint', 'very_good', 'good', 'fair', 'poor'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'collection_albums_price_nonnegative') THEN
    ALTER TABLE collection_albums ADD CONSTRAINT collection_albums_price_nonnegative
      CHECK (price IS NULL OR price >= 0);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS wantlist_items (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  album_id uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  preferred_edition varchar(300) NOT NULL DEFAULT '',
  notes varchar(500) NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, album_id)
);
CREATE INDEX IF NOT EXISTS wantlist_user_created_idx ON wantlist_items (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS listening_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  album_id uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  listened_at timestamptz NOT NULL DEFAULT now(),
  rating smallint,
  review varchar(1000),
  CONSTRAINT listening_history_rating_range CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
);
CREATE INDEX IF NOT EXISTS listening_history_user_date_idx ON listening_history (user_id, listened_at DESC);
