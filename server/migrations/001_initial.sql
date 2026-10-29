-- ============================================================================
-- TrackStack initial schema
--
-- Shared album metadata lives in `albums`. A user's private collections live
-- in `collections`, and `collection_albums` is the many-to-many join between
-- collections and albums. The join table is necessary because a collection
-- contains many albums and an album can belong to many collections.
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --- users ------------------------------------------------------------------
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username      varchar(40) NOT NULL,
  email         varchar(254) NOT NULL,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_username_length CHECK (char_length(btrim(username)) BETWEEN 2 AND 40),
  CONSTRAINT users_email_length CHECK (char_length(btrim(email)) BETWEEN 3 AND 254)
);

CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email));
CREATE UNIQUE INDEX users_username_lower_unique ON users (lower(username));

-- --- collections ------------------------------------------------------------
CREATE TABLE collections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        varchar(80) NOT NULL,
  description varchar(500) NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT collections_name_not_blank CHECK (char_length(btrim(name)) > 0)
);

CREATE INDEX collections_user_id_idx ON collections (user_id);
CREATE INDEX collections_updated_at_idx ON collections (updated_at DESC);
CREATE UNIQUE INDEX collections_user_name_lower_unique
  ON collections (user_id, lower(name));

-- --- albums -----------------------------------------------------------------
CREATE TABLE albums (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        varchar(500) NOT NULL,
  artist       varchar(300) NOT NULL,
  release_year smallint,
  genre        varchar(100),
  artwork_url  text,
  external_id  varchar(64) UNIQUE,
  track_count  integer,
  source       varchar(12) NOT NULL DEFAULT 'manual',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT albums_title_not_blank CHECK (char_length(btrim(title)) > 0),
  CONSTRAINT albums_artist_not_blank CHECK (char_length(btrim(artist)) > 0),
  CONSTRAINT albums_release_year_range CHECK (
    release_year IS NULL OR (release_year BETWEEN 1000 AND 2100)
  ),
  CONSTRAINT albums_track_count_non_negative CHECK (track_count IS NULL OR track_count >= 0),
  CONSTRAINT albums_source_valid CHECK (source IN ('itunes', 'manual'))
);

CREATE INDEX albums_title_lower_idx ON albums (lower(title));
CREATE INDEX albums_artist_lower_idx ON albums (lower(artist));

-- --- collection <-> album join ---------------------------------------------
CREATE TABLE collection_albums (
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  album_id      uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  added_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, album_id)
);

CREATE INDEX collection_albums_album_id_idx ON collection_albums (album_id);
CREATE INDEX collection_albums_added_at_idx ON collection_albums (collection_id, added_at DESC);

-- --- sessions ---------------------------------------------------------------
-- Column names are required by connect-pg-simple.
CREATE TABLE sessions (
  sid    varchar NOT NULL COLLATE "default",
  sess   json NOT NULL,
  expire timestamp(6) NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX sessions_expire_idx ON sessions (expire);

-- --- updated_at triggers ----------------------------------------------------
CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER collections_set_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER albums_set_updated_at
  BEFORE UPDATE ON albums
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
