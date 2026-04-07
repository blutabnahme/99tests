-- 1. Billing mode on recommendations
ALTER TABLE tt_recommendation 
ADD COLUMN IF NOT EXISTS billing_mode TEXT DEFAULT 'patient' CHECK (billing_mode IN ('patient', 'doctor'));

-- 2. Doctor billing service fee on platform config
ALTER TABLE tt_service_config 
ADD COLUMN IF NOT EXISTS doctor_billing_service_fee_pct NUMERIC DEFAULT 10;

-- 3. Custom doctor billing fee per doctor
ALTER TABLE tt_doctor 
ADD COLUMN IF NOT EXISTS custom_doctor_billing_fee_pct NUMERIC DEFAULT NULL;

-- 4. Doctor invoices
CREATE TABLE IF NOT EXISTS tt_doctor_invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES tt_doctor(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  subtotal NUMERIC DEFAULT 0,
  service_fee_total NUMERIC DEFAULT 0,
  vat_total NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Invoice line items (one per doctor-billed order)
CREATE TABLE IF NOT EXISTS tt_doctor_invoice_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES tt_doctor_invoice(id) ON DELETE CASCADE,
  order_id UUID REFERENCES tt_order(id),
  recommendation_id UUID REFERENCES tt_recommendation(id),
  patient_name TEXT,
  display_id TEXT,
  test_total NUMERIC DEFAULT 0,
  service_fee NUMERIC DEFAULT 0,
  shipping NUMERIC DEFAULT 0,
  vat NUMERIC DEFAULT 0,
  line_total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_doctor_invoice_doctor ON tt_doctor_invoice(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_invoice_status ON tt_doctor_invoice(status);
CREATE INDEX IF NOT EXISTS idx_doctor_invoice_period ON tt_doctor_invoice(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_doctor_invoice_item_invoice ON tt_doctor_invoice_item(invoice_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_billing_mode ON tt_recommendation(billing_mode);

-- 7. Invoice number counter on service config
ALTER TABLE tt_service_config 
ADD COLUMN IF NOT EXISTS invoice_counter INTEGER DEFAULT 0;

-- 8. invoice_id on tt_order
ALTER TABLE tt_order ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES tt_doctor_invoice(id);
CREATE INDEX IF NOT EXISTS idx_order_invoice ON tt_order(invoice_id);

-- 9. Shorter magic link generation
CREATE OR REPLACE FUNCTION tt_generate_recommendation_display_id()
RETURNS TRIGGER AS $$
DECLARE
  doctor_seq integer;
  rec_seq integer;
  candidate text;
BEGIN
  -- Get doctor's sequential number
  SELECT COALESCE(
    (SELECT COUNT(*) FROM tt_doctor WHERE created_at <= (SELECT created_at FROM tt_doctor WHERE id = NEW.doctor_id)),
    1
  ) INTO doctor_seq;
  
  -- Get highest existing sequence number
  SELECT COALESCE(MAX(
    CASE 
      WHEN display_id ~ ('^' || doctor_seq::text || '-[0-9]+$') 
      THEN CAST(SPLIT_PART(display_id, '-', 2) AS integer)
      ELSE 0
    END
  ), 0) + 1 INTO rec_seq
  FROM tt_recommendation
  WHERE doctor_id = NEW.doctor_id AND display_id IS NOT NULL;
  
  candidate := doctor_seq::text || '-' || LPAD(rec_seq::text, 5, '0');
  
  WHILE EXISTS (SELECT 1 FROM tt_recommendation WHERE display_id = candidate) LOOP
    rec_seq := rec_seq + 1;
    candidate := doctor_seq::text || '-' || LPAD(rec_seq::text, 5, '0');
  END LOOP;
  
  NEW.display_id := candidate;
  
  -- Generate shorter magic link (12 chars, URL-friendly)
  IF NEW.magic_link IS NULL THEN
    NEW.magic_link := substr(encode(gen_random_bytes(9), 'base64'), 1, 12);
    -- Replace non-URL chars
    NEW.magic_link := replace(replace(NEW.magic_link, '+', 'x'), '/', 'y');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
