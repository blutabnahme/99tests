-- ============================================================
-- Migration 023: Private Laboratories
-- ============================================================

-- Add is_private flag to tt_laboratory
ALTER TABLE tt_laboratory ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;

COMMENT ON COLUMN tt_laboratory.is_private IS 'When true, lab tests only visible to explicitly linked doctors';

-- Junction table: which doctors can see which private labs
CREATE TABLE IF NOT EXISTS tt_doctor_laboratory (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id   uuid NOT NULL REFERENCES tt_doctor(id) ON DELETE CASCADE,
  laboratory_id uuid NOT NULL REFERENCES tt_laboratory(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_doctor_laboratory_unique
  ON tt_doctor_laboratory(doctor_id, laboratory_id);

CREATE INDEX IF NOT EXISTS idx_doctor_laboratory_doctor
  ON tt_doctor_laboratory(doctor_id);

CREATE INDEX IF NOT EXISTS idx_doctor_laboratory_lab
  ON tt_doctor_laboratory(laboratory_id);

COMMENT ON TABLE tt_doctor_laboratory IS 'Doctors with access to private laboratories';
