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
