-- Migration 011: Add doctor verification fields

-- Only run if tt_doctor doesn't already have a verification_status column
ALTER TABLE tt_doctor
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

-- Also add rejection fields
ALTER TABLE tt_doctor
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID;

-- Set existing active doctors as verified
UPDATE tt_doctor SET verification_status = 'verified' WHERE is_active = true;
-- Set inactive doctors as pending
UPDATE tt_doctor SET verification_status = 'pending' WHERE is_active = false AND verification_status IS NULL;
