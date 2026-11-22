-- UniHop schema. Idempotent: safe to run on every start.
-- Relationships:  users 1─* rides (driver)   users 1─* bookings (passenger)
--                 rides 1─* bookings         users *─* rides via saved_rides

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,                 -- bcrypt hash, never the password
  campus        TEXT        NOT NULL CHECK (campus IN ('LAU Beirut', 'LAU Byblos')),
  gender        TEXT        NOT NULL CHECK (gender IN ('female', 'male')),
  rating        NUMERIC(2,1) NOT NULL DEFAULT 0,
  verified      BOOLEAN     NOT NULL DEFAULT TRUE,
  phone         TEXT        NOT NULL DEFAULT '',
  bio           TEXT        NOT NULL DEFAULT '',
  car           JSONB,                                -- {make, model, color, plate, languages[], permitVerified, trips}
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rides (
  id             TEXT PRIMARY KEY,
  driver_id      TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction      TEXT        NOT NULL CHECK (direction IN ('toCampus', 'fromCampus')),
  girls_only     BOOLEAN     NOT NULL DEFAULT FALSE,
  origin_area    TEXT        NOT NULL,
  origin_label   TEXT        NOT NULL,
  campus         TEXT        NOT NULL CHECK (campus IN ('LAU Beirut', 'LAU Byblos')),
  meeting_point  TEXT        NOT NULL,
  depart_at      TIMESTAMPTZ NOT NULL,
  return_at      TIMESTAMPTZ,
  seats_total    INTEGER     NOT NULL CHECK (seats_total BETWEEN 1 AND 6),
  price_per_seat NUMERIC(6,2) NOT NULL CHECK (price_per_seat BETWEEN 0 AND 50),
  notes          TEXT        NOT NULL DEFAULT '',
  tags           TEXT[]      NOT NULL DEFAULT '{}',
  status         TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'cancelled', 'completed')),
  posted_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rides_driver_idx ON rides (driver_id);
CREATE INDEX IF NOT EXISTS rides_depart_idx ON rides (depart_at);

CREATE TABLE IF NOT EXISTS bookings (
  id           TEXT PRIMARY KEY,
  ride_id      TEXT        NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  passenger_id TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seats        INTEGER     NOT NULL CHECK (seats BETWEEN 1 AND 6),
  status       TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled')),
  note         TEXT        NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_ride_idx ON bookings (ride_id);
CREATE INDEX IF NOT EXISTS bookings_passenger_idx ON bookings (passenger_id);
-- A passenger can hold only one live (pending/confirmed) booking per ride.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_one_live_idx ON bookings (ride_id, passenger_id) WHERE status IN ('pending', 'confirmed');

CREATE TABLE IF NOT EXISTS saved_rides (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ride_id TEXT NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, ride_id)
);
