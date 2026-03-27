-- Extending Payment records defining exact SLA disputes blocking automated payout sweeps natively
ALTER TABLE payment ADD COLUMN IF NOT EXISTS dispute_reason VARCHAR(100) DEFAULT NULL;
ALTER TABLE payment ADD COLUMN IF NOT EXISTS dispute_description TEXT DEFAULT NULL;
ALTER TABLE payment ADD COLUMN IF NOT EXISTS dispute_at TIMESTAMPTZ DEFAULT NULL;
