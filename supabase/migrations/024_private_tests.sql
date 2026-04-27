-- Migration 024: Private tests
ALTER TABLE tt_test_catalog ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS tt_doctor_test (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id   uuid NOT NULL REFERENCES tt_doctor(id) ON DELETE CASCADE,
  test_id     uuid NOT NULL REFERENCES tt_test_catalog(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_doctor_test_unique
  ON tt_doctor_test(doctor_id, test_id);

CREATE INDEX IF NOT EXISTS idx_doctor_test_doctor
  ON tt_doctor_test(doctor_id);

CREATE INDEX IF NOT EXISTS idx_doctor_test_test
  ON tt_doctor_test(test_id);

COMMENT ON COLUMN tt_test_catalog.is_private IS 'When true, test only visible to explicitly linked doctors';
COMMENT ON TABLE tt_doctor_test IS 'Doctors with access to private tests';
