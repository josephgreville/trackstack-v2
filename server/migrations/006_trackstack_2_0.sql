-- ============================================================================
-- TrackStack 2.0 schema additions
--
-- Gamification, social, stories, recommendations, smart wantlist,
-- visual collection room and wrapped recap tables.
-- ============================================================================

-- --- extended user profile (gamification + social) ------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bio varchar(500) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS location varchar(100),
  ADD COLUMN IF NOT EXISTS website varchar(254);

CREATE INDEX IF NOT EXISTS users_xp_idx ON users (xp DESC);

-- --- achievement definitions ----------------------------------------------
CREATE TABLE IF NOT EXISTS achievements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         varchar(100) NOT NULL UNIQUE,
  name        varchar(100) NOT NULL,
  description varchar(500) NOT NULL DEFAULT '',
  icon        varchar(50) NOT NULL DEFAULT 'trophy',
  xp_reward   integer NOT NULL DEFAULT 0,
  criteria    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS achievements_key_unique ON achievements (key);

-- --- user earned achievements ---------------------------------------------
CREATE TABLE IF NOT EXISTS user_achievements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);
CREATE INDEX IF NOT EXISTS user_achievements_user_idx ON user_achievements (user_id);

-- --- social follows -------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_follows (
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT user_follows_no_self CHECK (follower_id <> following_id)
);
CREATE INDEX IF NOT EXISTS user_follows_follower_idx ON user_follows (follower_id);
CREATE INDEX IF NOT EXISTS user_follows_following_idx ON user_follows (following_id);

-- --- activity feed --------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_feed (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        varchar(50) NOT NULL,               -- listen, collect, want, acquire, follow, share
  target_type varchar(50) NOT NULL,               -- album, collection, user
  target_id   uuid NOT NULL,
  metadata    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_feed_user_created_idx ON activity_feed (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_feed_global_created_idx ON activity_feed (created_at DESC);

-- --- notifications --------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        varchar(50) NOT NULL,               -- follow, like, comment, price_alert, achievement
  actor_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  target_type varchar(50),
  target_id   uuid,
  message     varchar(300) NOT NULL,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_read_created_idx
  ON notifications (user_id, read, created_at DESC);

-- --- likes on shared content ----------------------------------------------
CREATE TABLE IF NOT EXISTS likes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type varchar(50) NOT NULL,               -- collection, album
  target_id   uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS likes_target_idx ON likes (target_type, target_id);

-- --- comments on shared content -------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type varchar(50) NOT NULL,
  target_id   uuid NOT NULL,
  body        varchar(1000) NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comments_target_idx ON comments (target_type, target_id, created_at DESC);

-- --- album stories (personal memories) ------------------------------------
CREATE TABLE IF NOT EXISTS album_stories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  album_id    uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  title       varchar(200) NOT NULL DEFAULT '',
  body        text NOT NULL DEFAULT '',
  location    varchar(200),
  occurred_at date,
  is_public   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, album_id)
);
CREATE INDEX IF NOT EXISTS album_stories_user_idx ON album_stories (user_id);
CREATE INDEX IF NOT EXISTS album_stories_album_idx ON album_stories (album_id);

-- --- album photos (photos of physical records) ----------------------------
CREATE TABLE IF NOT EXISTS album_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  album_id    uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  story_id    uuid REFERENCES album_stories(id) ON DELETE SET NULL,
  url         text NOT NULL,
  caption     varchar(300),
  taken_at    date,
  is_cover    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS album_photos_user_idx ON album_photos (user_id);
CREATE INDEX IF NOT EXISTS album_photos_album_idx ON album_photos (album_id);

-- --- collection shelf themes / visual room --------------------------------
ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS shelf_theme varchar(50) NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS layout_pref varchar(50) NOT NULL DEFAULT 'grid';

CREATE INDEX IF NOT EXISTS collections_shelf_theme_idx ON collections (shelf_theme);

-- --- smart wantlist: priority + price alerts ------------------------------
ALTER TABLE wantlist_items
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS price_alert boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_notified_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wantlist_items_priority_valid') THEN
    ALTER TABLE wantlist_items ADD CONSTRAINT wantlist_items_priority_valid
      CHECK (priority BETWEEN 1 AND 3);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS wantlist_items_priority_idx ON wantlist_items (user_id, priority DESC, created_at DESC);

-- --- recommendations (discover weekly / AI suggestions) -------------------
CREATE TABLE IF NOT EXISTS recommendations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  album_id    uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  reason      varchar(300) NOT NULL DEFAULT '',
  score       numeric(5,2) NOT NULL DEFAULT 0,
  kind        varchar(50) NOT NULL DEFAULT 'similar', -- similar, genre, mood, hidden_gem, new_to_you
  created_at  timestamptz NOT NULL DEFAULT now(),
  dismissed   boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, album_id, kind)
);
CREATE INDEX IF NOT EXISTS recommendations_user_kind_idx ON recommendations (user_id, kind, score DESC);

-- --- listening session tracking (for wrapped) -----------------------------
CREATE TABLE IF NOT EXISTS listening_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  album_id    uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  started_at  timestamptz NOT NULL DEFAULT now(),
  duration_ms integer NOT NULL DEFAULT 0,
  completed   boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS listening_sessions_user_date_idx ON listening_sessions (user_id, started_at DESC);

-- --- updated_at trigger for album_stories ---------------------------------
CREATE TRIGGER album_stories_set_updated_at
  BEFORE UPDATE ON album_stories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- --- seed default achievements --------------------------------------------
INSERT INTO achievements (key, name, description, icon, xp_reward, criteria) VALUES
  ('first_listen', 'First Spin', 'Logged your first album listen.', 'play', 50, '{"listens": 1}'),
  ('century_collector', 'Century Collector', 'Collected 100 albums.', 'collection', 500, '{"collection_count": 100}'),
  ('genre_explorer', 'Genre Explorer', 'Listened to albums from 10 different genres.', 'compass', 300, '{"genre_count": 10}'),
  ('week_streak', 'Seven Day Streak', 'Listened on 7 consecutive days.', 'calendar', 250, '{"streak_days": 7}'),
  ('wantlist_hunter', 'Wantlist Hunter', 'Added 10 albums to your wantlist.', 'wishlist', 200, '{"wantlist_count": 10}'),
  ('social_collector', 'Social Collector', 'Followed 5 other collectors.', 'users', 150, '{"following_count": 5}'),
  ('storyteller', 'Storyteller', 'Added a story to an album.', 'book', 100, '{"story_count": 1}'),
  ('vinyl_loyalist', 'Vinyl Loyalist', 'Collected 25 vinyl records.', 'disc', 250, '{"format_count": {"vinyl": 25}}')
ON CONFLICT (key) DO NOTHING;
