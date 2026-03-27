-- Create the hc_invoice table
CREATE TABLE hc_invoice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hc_id uuid REFERENCES healthcare_company(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  case_count integer NOT NULL DEFAULT 0,
  org_fees_total numeric(10,2) NOT NULL DEFAULT 0,
  material_fees_total numeric(10,2) NOT NULL DEFAULT 0,
  logistics_fees_total numeric(10,2) NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  vat_amount numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending, paid, overdue
  due_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX idx_hc_invoice_hc_id ON hc_invoice(hc_id);
CREATE INDEX idx_hc_invoice_status ON hc_invoice(status);
CREATE INDEX idx_hc_invoice_number ON hc_invoice(invoice_number);

-- Link payments to the invoice
ALTER TABLE payment
ADD COLUMN hc_invoice_id uuid REFERENCES hc_invoice(id) ON DELETE SET NULL;

CREATE INDEX idx_payment_hc_invoice ON payment(hc_invoice_id);

-- Enable RLS
ALTER TABLE hc_invoice ENABLE ROW LEVEL SECURITY;

-- HC Policies
CREATE POLICY "HC can view their own invoices" 
  ON hc_invoice FOR SELECT 
  USING (auth.uid() = hc_id);

-- Admin Policies
CREATE POLICY "Admins can manage all invoices" 
  ON hc_invoice FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
