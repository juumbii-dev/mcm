ALTER TABLE bookings
  ALTER COLUMN meeting_link TYPE TEXT
  USING meeting_link::TEXT;
