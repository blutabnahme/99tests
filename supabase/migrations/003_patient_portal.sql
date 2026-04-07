-- ============================================================
-- 99Tests 2.0 — Migration 003: Patient Portal & Magic Link
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Patient Token Table
CREATE TABLE tt_patient_token (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token         text UNIQUE NOT NULL,
  recommendation_id uuid NOT NULL REFERENCES tt_recommendation(id) ON DELETE CASCADE,
  patient_id    uuid NOT NULL REFERENCES tt_patient(id),
  expires_at    timestamptz NOT NULL,
  is_used       boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_patient_token ON tt_patient_token(token);
CREATE INDEX idx_patient_token_rec ON tt_patient_token(recommendation_id);

COMMENT ON TABLE tt_patient_token IS 'Magic link tokens exclusively pointing patients towards test recommendations.';

-- 2. Expand Recommendation with address retention + link storage
ALTER TABLE tt_recommendation 
ADD COLUMN magic_link text,
ADD COLUMN shipping_address jsonb,
ADD COLUMN billing_address jsonb;

COMMENT ON COLUMN tt_recommendation.magic_link IS 'Frontend generated phase 2 url referencing tt_patient_token';
COMMENT ON COLUMN tt_recommendation.shipping_address IS 'Temporary hold payload matching tt_order constraints before checkout mock completes.';
COMMENT ON COLUMN tt_recommendation.billing_address IS 'Temporary hold payload matching tt_order constraints before checkout mock completes.';

-- ============================================================
-- Migration 003 complete.
