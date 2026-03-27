-- Adding Blood Collector explicit collection tracking boundaries
ALTER TABLE "case" ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE "case" ADD COLUMN IF NOT EXISTS completion_notes TEXT DEFAULT NULL;

-- Expanding payment infrastructure tracking SLA completion validations mapping into actual payout executions
ALTER TABLE payment ADD COLUMN IF NOT EXISTS bc_confirmation_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE payment ADD COLUMN IF NOT EXISTS hc_confirmation_deadline TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE payment ADD COLUMN IF NOT EXISTS hc_confirmed_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE payment ADD COLUMN IF NOT EXISTS payout_status VARCHAR(50) DEFAULT 'pending';
