-- Add new fields to payment table to support detailed breakdowns
ALTER TABLE payment
RENAME COLUMN amount TO patient_amount;

ALTER TABLE payment
ADD COLUMN appointment_id uuid REFERENCES appointment(id) ON DELETE SET NULL,
ADD COLUMN vat_amount numeric(10,2) NOT NULL DEFAULT 0,
ADD COLUMN bc_payout numeric(10,2) NOT NULL DEFAULT 0,
ADD COLUMN platform_commission numeric(10,2) NOT NULL DEFAULT 0,
ADD COLUMN b2b_fee numeric(10,2) NOT NULL DEFAULT 0,
ADD COLUMN material_revenue numeric(10,2) NOT NULL DEFAULT 0,
ADD COLUMN logistics_revenue numeric(10,2) NOT NULL DEFAULT 0,
ADD COLUMN paid_at timestamptz;

-- Ensure indexes are present for reporting
CREATE INDEX IF NOT EXISTS idx_payment_appointment_id ON payment(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment(status);
