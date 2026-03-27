-- Migration 020: Patient Portal Performance Indexes

CREATE INDEX IF NOT EXISTS idx_match_case_id ON match(case_id);
CREATE INDEX IF NOT EXISTS idx_appointment_case_id ON appointment(case_id);
CREATE INDEX IF NOT EXISTS idx_review_case_id ON review(case_id);
CREATE INDEX IF NOT EXISTS idx_bc_availability_bc_id ON bc_availability(bc_id);
CREATE INDEX IF NOT EXISTS idx_bc_availability_specific_date ON bc_availability(specific_date);
