ALTER TABLE albums
  ADD COLUMN IF NOT EXISTS track_count integer,
  ADD COLUMN IF NOT EXISTS source varchar(12) NOT NULL DEFAULT 'manual';

ALTER TABLE albums
  DROP CONSTRAINT IF EXISTS albums_release_year_range,
  ADD CONSTRAINT albums_release_year_range
    CHECK (release_year IS NULL OR (release_year BETWEEN 1000 AND 2100));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'albums_track_count_non_negative'
  ) THEN
    ALTER TABLE albums ADD CONSTRAINT albums_track_count_non_negative
      CHECK (track_count IS NULL OR track_count >= 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'albums_source_valid'
  ) THEN
    ALTER TABLE albums ADD CONSTRAINT albums_source_valid
      CHECK (source IN ('itunes', 'manual'));
  END IF;
END;
$$;

DROP INDEX IF EXISTS albums_manual_title_artist_key;

CREATE INDEX IF NOT EXISTS albums_title_lower_idx ON albums (lower(title));
CREATE INDEX IF NOT EXISTS albums_artist_lower_idx ON albums (lower(artist));
CREATE INDEX IF NOT EXISTS collections_updated_at_idx ON collections (updated_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sessions'
      AND column_name = 'sid'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'sessions'
    ) THEN
      IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'sessions_legacy_auth'
      ) THEN
        RAISE EXCEPTION 'Cannot preserve legacy sessions: sessions_legacy_auth already exists.';
      END IF;
      ALTER TABLE sessions RENAME TO sessions_legacy_auth;
    END IF;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS sessions (
  sid    varchar NOT NULL COLLATE "default",
  sess   json NOT NULL,
  expire timestamp(6) NOT NULL,
  CONSTRAINT sessions_store_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions (expire);
