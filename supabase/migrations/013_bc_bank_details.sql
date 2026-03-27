-- Add encrypted bank details to blood_collector
ALTER TABLE blood_collector
ADD COLUMN encrypted_bank_details text;

-- Create bc_payouts table to track payout batches
CREATE TABLE bc_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bc_id uuid REFERENCES blood_collector(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  case_count integer NOT NULL DEFAULT 0,
  gross_amount numeric(10,2) NOT NULL DEFAULT 0,
  commission_total numeric(10,2) NOT NULL DEFAULT 0,
  net_amount numeric(10,2) NOT NULL DEFAULT 0,
  reference_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, processed
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX idx_bc_payouts_bc_id ON bc_payouts(bc_id);
CREATE INDEX idx_bc_payouts_status ON bc_payouts(status);

-- Enable RLS
ALTER TABLE bc_payouts ENABLE ROW LEVEL SECURITY;

-- BC Policies
CREATE POLICY "BCs can view their own payouts" 
  ON bc_payouts FOR SELECT 
  USING (auth.uid() = bc_id);

-- Admin Policies
CREATE POLICY "Admins can manage all payouts" 
  ON bc_payouts FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
