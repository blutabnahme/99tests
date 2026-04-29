-- ============================================================
-- Migration 026: Doctor WP ID + Title + Display ID Triggers
-- ============================================================

-- Add wp_id (WordPress numeric user ID) to tt_doctor
ALTER TABLE tt_doctor ADD COLUMN IF NOT EXISTS wp_id integer UNIQUE;
ALTER TABLE tt_doctor ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE tt_doctor ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE tt_doctor ADD COLUMN IF NOT EXISTS gender tt_gender;
ALTER TABLE tt_doctor ADD COLUMN IF NOT EXISTS address_line_2 text;
ALTER TABLE tt_doctor ADD COLUMN IF NOT EXISTS address_state text;
ALTER TABLE tt_doctor ADD COLUMN IF NOT EXISTS referral text;
ALTER TABLE tt_doctor ADD COLUMN IF NOT EXISTS eligible_for_pvs boolean DEFAULT true;

COMMENT ON COLUMN tt_doctor.wp_id IS 'WordPress user ID — used as prefix in recommendation/order display IDs';
COMMENT ON COLUMN tt_doctor.title IS 'Academic/medical title, e.g. Dr. med., Prof. Dr.';
COMMENT ON COLUMN tt_doctor.date_of_birth IS 'Doctor date of birth';
COMMENT ON COLUMN tt_doctor.gender IS 'M/W/D';
COMMENT ON COLUMN tt_doctor.address_line_2 IS 'Address line 2 (floor, suite, etc.)';
COMMENT ON COLUMN tt_doctor.address_state IS 'State/Bundesland';
COMMENT ON COLUMN tt_doctor.referral IS 'Referral user ID or code for partner program';
COMMENT ON COLUMN tt_doctor.eligible_for_pvs IS 'When false, doctor is excluded from PAD/PVS billing';

CREATE INDEX IF NOT EXISTS idx_doctor_wp_id ON tt_doctor(wp_id);

-- ============================================================
-- Update recommendation display_id trigger
-- Format: {doctor_wp_id}-{global_sequence_5_digits}
-- e.g. 2-00011, 5-00012
-- Sequence is global across all doctors
-- ============================================================

CREATE OR REPLACE FUNCTION tt_generate_recommendation_display_id()
RETURNS trigger AS $$
DECLARE
  next_num integer;
  doctor_wp integer;
BEGIN
  -- Get the doctor's wp_id
  SELECT wp_id INTO doctor_wp
  FROM tt_doctor
  WHERE id = NEW.doctor_id;

  -- If no wp_id found, fall back to 0
  IF doctor_wp IS NULL THEN
    doctor_wp := 0;
  END IF;

  -- Get next global sequence number (extract number after the dash from ALL display_ids)
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(display_id FROM POSITION('-' IN display_id) + 1) AS integer)
  ), 0) + 1 INTO next_num
  FROM tt_recommendation
  WHERE display_id IS NOT NULL AND display_id ~ '^\d+-\d+$';

  NEW.display_id := doctor_wp::text || '-' || LPAD(next_num::text, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Update order display_id trigger
-- Same format: {doctor_wp_id}-{global_sequence_5_digits}
-- Shares the same sequence space as recommendations
-- ============================================================

CREATE OR REPLACE FUNCTION tt_generate_order_display_id()
RETURNS trigger AS $$
DECLARE
  next_num integer;
  doctor_wp integer;
BEGIN
  -- Get the doctor's wp_id
  SELECT wp_id INTO doctor_wp
  FROM tt_doctor
  WHERE id = NEW.doctor_id;

  IF doctor_wp IS NULL THEN
    doctor_wp := 0;
  END IF;

  -- Get next global sequence from BOTH recommendations and orders
  SELECT COALESCE(MAX(seq), 0) + 1 INTO next_num
  FROM (
    SELECT CAST(SUBSTRING(display_id FROM POSITION('-' IN display_id) + 1) AS integer) as seq
    FROM tt_recommendation
    WHERE display_id IS NOT NULL AND display_id ~ '^\d+-\d+$'
    UNION ALL
    SELECT CAST(SUBSTRING(display_id FROM POSITION('-' IN display_id) + 1) AS integer) as seq
    FROM tt_order
    WHERE display_id IS NOT NULL AND display_id ~ '^\d+-\d+$'
  ) combined;

  NEW.display_id := doctor_wp::text || '-' || LPAD(next_num::text, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verification
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'tt_doctor' AND column_name IN ('wp_id', 'title', 'date_of_birth', 'gender', 'address_line_2', 'address_state', 'referral', 'eligible_for_pvs')
ORDER BY column_name;
