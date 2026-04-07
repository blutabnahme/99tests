CREATE OR REPLACE FUNCTION tt_generate_recommendation_display_id()
RETURNS TRIGGER AS $$
DECLARE
  doctor_seq integer;
  rec_seq integer;
  candidate text;
  max_existing integer;
BEGIN
  -- Get doctor's sequential number (based on creation order)
  SELECT COALESCE(
    (SELECT COUNT(*) FROM tt_doctor WHERE created_at <= (SELECT created_at FROM tt_doctor WHERE id = NEW.doctor_id)),
    1
  ) INTO doctor_seq;
  
  -- Get the highest existing sequence number for this doctor
  SELECT COALESCE(MAX(
    CASE 
      WHEN display_id ~ ('^' || doctor_seq::text || '-[0-9]+$') 
      THEN CAST(SPLIT_PART(display_id, '-', 2) AS integer)
      ELSE 0
    END
  ), 0) + 1 INTO rec_seq
  FROM tt_recommendation
  WHERE doctor_id = NEW.doctor_id AND display_id IS NOT NULL;
  
  candidate := doctor_seq::text || '-' || LPAD(rec_seq::text, 5, '0');
  
  -- Safety: if candidate already exists, increment until unique
  WHILE EXISTS (SELECT 1 FROM tt_recommendation WHERE display_id = candidate) LOOP
    rec_seq := rec_seq + 1;
    candidate := doctor_seq::text || '-' || LPAD(rec_seq::text, 5, '0');
  END LOOP;
  
  NEW.display_id := candidate;
  
  -- Also generate magic_link if not set
  IF NEW.magic_link IS NULL THEN
    NEW.magic_link := encode(gen_random_bytes(32), 'hex');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
