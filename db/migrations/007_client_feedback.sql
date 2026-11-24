CREATE TABLE IF NOT EXISTS client_feedback (
  id SERIAL PRIMARY KEY,
  therapist_id INTEGER REFERENCES psychologists(id),
  client_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
