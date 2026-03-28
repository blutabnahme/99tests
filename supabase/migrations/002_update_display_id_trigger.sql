CREATE OR REPLACE FUNCTION tt_generate_recommendation_display_id()
RETURNS trigger AS $$
DECLARE
  doctor_seq integer;
  rec_seq integer;
BEGIN
  -- Get doctor's sequential number (based on creation order)
  SELECT COALESCE(
    (SELECT COUNT(*) FROM tt_doctor WHERE created_at <= (SELECT created_at FROM tt_doctor WHERE id = NEW.doctor_id)),
    1
  ) INTO doctor_seq;
  
  -- Get this doctor's recommendation count
  SELECT COALESCE(COUNT(*), 0) + 1 INTO rec_seq
  FROM tt_recommendation
  WHERE doctor_id = NEW.doctor_id AND display_id IS NOT NULL;
  
  NEW.display_id := doctor_seq::text || '-' || LPAD(rec_seq::text, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
