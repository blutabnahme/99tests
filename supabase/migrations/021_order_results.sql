-- ============================================
-- Migration 021: Results Module
-- ============================================

-- 1. Create enum types
CREATE TYPE tt_result_status AS ENUM ('uploaded', 'doctor_reviewing', 'released');
CREATE TYPE tt_result_visibility AS ENUM ('doctor_and_patient', 'doctor_only', 'patient_only');

-- 2. Create tt_order_result table
CREATE TABLE tt_order_result (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES tt_order(id) ON DELETE CASCADE,
  laboratory_id UUID REFERENCES tt_laboratory(id),
  
  -- File
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'pdf',
  file_size_bytes INTEGER,
  
  -- Test coverage
  tests_covered JSONB NOT NULL DEFAULT '[]',
  
  -- Routing
  visibility tt_result_visibility NOT NULL DEFAULT 'doctor_and_patient',
  status tt_result_status NOT NULL DEFAULT 'uploaded',
  auto_release BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Review & Release
  released_at TIMESTAMPTZ,
  released_by TEXT,
  doctor_reviewed_at TIMESTAMPTZ,
  doctor_notes TEXT,
  
  -- Admin
  uploaded_by TEXT NOT NULL,
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX idx_order_result_order ON tt_order_result(order_id);
CREATE INDEX idx_order_result_status ON tt_order_result(status);
CREATE INDEX idx_order_result_lab ON tt_order_result(laboratory_id);
