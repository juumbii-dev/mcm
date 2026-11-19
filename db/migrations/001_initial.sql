CREATE TABLE IF NOT EXISTS psychologists (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  focus TEXT NOT NULL,
  rating NUMERIC(2, 1) DEFAULT 0,
  price INTEGER DEFAULT 0,
  city TEXT NOT NULL,
  experience INTEGER DEFAULT 0,
  availability JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client',
  psychologist_id INTEGER REFERENCES psychologists(id),
  bio TEXT,
  avatar TEXT,
  experience INTEGER DEFAULT 0,
  expertise TEXT,
  qualifications TEXT,
  city TEXT,
  age INTEGER,
  gender TEXT,
  profession TEXT,
  marital_status TEXT,
  interests TEXT,
  issues TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  psychologist_id INTEGER NOT NULL REFERENCES psychologists(id),
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  date DATE NOT NULL,
  slot TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  format TEXT,
  payment_method TEXT,
  meeting_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meeting_link TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;